import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseServiceClient,
  hasServiceRole,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { COMPLETE_THRESHOLD } from "@/lib/student-progress";

/**
 * Progresso REAL do aluno por aula, persistido em `lesson_completions`
 * (migrations 0004 + 0006). Cada linha guarda a maior % assistida da aula
 * (`percent`, 0–100) e, quando concluída (>= 95%), a data em `completed_at`.
 *
 * Alimenta as barras de % (aula/curso/aplicação), o "Continuar de onde parou"
 * e a emissão de certificados (100%). Chave do aluno = `auth.users.id`.
 *
 * Tolerante à ausência da coluna `percent` (migration 0006 ainda não rodada):
 * nesse caso trata linhas existentes como 100% e só grava ao concluir.
 */

export type LessonProgressRow = {
  lessonId: string;
  courseId: string;
  percent: number;
  completedAt: string | null;
};

function db(): SupabaseClient {
  return createSupabaseServiceClient() as unknown as SupabaseClient;
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /does not exist|schema cache|could not find the table/i.test(msg)
  );
}

function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return error.code === "42703" || /percent/i.test(msg) && /column|does not exist|schema cache/i.test(msg);
}

/** Progresso por aula do aluno. Retorna [] se Supabase/tabela ausente (tolerante). */
export async function getStudentProgress(
  studentId: string | null | undefined,
): Promise<LessonProgressRow[]> {
  if (!studentId || !isSupabaseConfigured() || !hasServiceRole()) return [];
  try {
    // Tenta com `percent` (0006). Se a coluna não existir, cai para o formato antigo.
    const withPercent = await db()
      .from("lesson_completions")
      .select("lesson_id, course_id, percent, completed_at")
      .eq("student_id", studentId);

    if (!withPercent.error) {
      return (withPercent.data ?? []).map((r: Record<string, unknown>) => ({
        lessonId: String(r.lesson_id ?? ""),
        courseId: String(r.course_id ?? ""),
        percent: clampPercent(Number(r.percent ?? 0)),
        completedAt: r.completed_at ? String(r.completed_at) : null,
      }));
    }
    if (!isMissingColumn(withPercent.error)) return [];

    // Fallback pré-0006: sem coluna percent → linhas existentes são conclusões (100%).
    const legacy = await db()
      .from("lesson_completions")
      .select("lesson_id, course_id, completed_at")
      .eq("student_id", studentId);
    if (legacy.error) return [];
    return (legacy.data ?? []).map((r: Record<string, unknown>) => ({
      lessonId: String(r.lesson_id ?? ""),
      courseId: String(r.course_id ?? ""),
      percent: 100,
      completedAt: r.completed_at ? String(r.completed_at) : null,
    }));
  } catch {
    return [];
  }
}

/**
 * Salva o progresso (%) de uma aula, mantendo sempre o MAIOR valor já assistido.
 * Marca `completed_at` quando atinge o limiar de conclusão. Idempotente.
 */
export async function saveLessonProgress(
  studentId: string,
  lessonId: string,
  courseId: string,
  percent: number,
): Promise<void> {
  if (!studentId || !lessonId) return;
  if (!isSupabaseConfigured() || !hasServiceRole()) {
    throw new Error("Progresso indisponível: SUPABASE_SERVICE_ROLE_KEY ausente.");
  }

  const incoming = clampPercent(percent);

  // Lê o estado atual para nunca regredir a % nem "desconcluir".
  const current = await db()
    .from("lesson_completions")
    .select("percent, completed_at")
    .eq("student_id", studentId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const hasPercentColumn = !current.error || !isMissingColumn(current.error);

  // Sem a coluna percent (pré-0006): só registra ao concluir (comportamento antigo).
  if (!hasPercentColumn) {
    if (incoming >= COMPLETE_THRESHOLD) {
      await legacyUpsertCompleted(studentId, lessonId, courseId);
    }
    return;
  }

  const prevPercent = clampPercent(Number(current.data?.percent ?? 0));
  const prevCompletedAt = (current.data?.completed_at as string | null) ?? null;
  // Ao atingir o limiar, a aula é CONCLUÍDA → fixa em 100% (barra cheia).
  const rawNext = Math.max(prevPercent, incoming);
  const nextPercent = rawNext >= COMPLETE_THRESHOLD ? 100 : rawNext;
  const completedAt =
    nextPercent >= COMPLETE_THRESHOLD
      ? prevCompletedAt ?? new Date().toISOString()
      : null;

  const { error } = await db()
    .from("lesson_completions")
    .upsert(
      {
        student_id: studentId,
        lesson_id: lessonId,
        course_id: courseId || null,
        percent: nextPercent,
        completed_at: completedAt,
      },
      { onConflict: "student_id,lesson_id" },
    );

  if (error) {
    if (isMissingColumn(error)) {
      // Coluna sumiu entre a leitura e a escrita: cai para o formato antigo.
      if (nextPercent >= COMPLETE_THRESHOLD) {
        await legacyUpsertCompleted(studentId, lessonId, courseId);
      }
      return;
    }
    if (isMissingTable(error)) {
      throw new Error(
        "A tabela de progresso ainda não existe. Rode as migrations 0004 e 0006 no Supabase.",
      );
    }
    throw new Error(`Falha ao salvar progresso: ${error.message}`);
  }
}

/** Marca a aula como concluída (100%). Mantido para o fim do vídeo. */
export async function markLessonCompleted(
  studentId: string,
  lessonId: string,
  courseId: string,
): Promise<void> {
  await saveLessonProgress(studentId, lessonId, courseId, 100);
}

/* -------------------------------------------------------------------------- */

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Upsert no formato antigo (sem coluna percent): registra apenas a conclusão. */
async function legacyUpsertCompleted(
  studentId: string,
  lessonId: string,
  courseId: string,
): Promise<void> {
  const { error } = await db()
    .from("lesson_completions")
    .upsert(
      {
        student_id: studentId,
        lesson_id: lessonId,
        course_id: courseId || null,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "student_id,lesson_id" },
    );
  if (error && isMissingTable(error)) {
    throw new Error(
      "A tabela de progresso ainda não existe. Rode a migration 0004 no Supabase.",
    );
  }
}
