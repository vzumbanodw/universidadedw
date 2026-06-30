import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseServiceClient,
  hasServiceRole,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

/**
 * Progresso REAL do aluno (conclusão de vídeos), persistido na tabela
 * `lesson_completions` (migration 0004). Diferente de `lib/admin/progress.ts`,
 * que deriva números fake para as telas do operador.
 *
 * Chave do aluno = id no Supabase Auth (`auth.users.id`).
 */

export type LessonCompletion = {
  lessonId: string;
  courseId: string;
  completedAt: string;
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

/** Conclusões de um aluno. Retorna [] se Supabase/tabela ausente (tolerante). */
export async function getStudentCompletions(
  studentId: string | null | undefined,
): Promise<LessonCompletion[]> {
  if (!studentId || !isSupabaseConfigured() || !hasServiceRole()) return [];
  try {
    const { data, error } = await db()
      .from("lesson_completions")
      .select("lesson_id, course_id, completed_at")
      .eq("student_id", studentId);
    if (error) return []; // tabela ainda não criada → trata como vazio
    return (data ?? []).map((r: Record<string, unknown>) => ({
      lessonId: String(r.lesson_id ?? ""),
      courseId: String(r.course_id ?? ""),
      completedAt: String(r.completed_at ?? ""),
    }));
  } catch {
    return [];
  }
}

/** Marca uma aula como concluída para o aluno (idempotente). */
export async function markLessonCompleted(
  studentId: string,
  lessonId: string,
  courseId: string,
): Promise<void> {
  if (!studentId || !lessonId) return;
  if (!isSupabaseConfigured() || !hasServiceRole()) {
    throw new Error("Progresso indisponível: SUPABASE_SERVICE_ROLE_KEY ausente.");
  }
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
  if (error) {
    if (isMissingTable(error)) {
      throw new Error(
        "A tabela de progresso ainda não existe. Rode a migration 0004 no Supabase.",
      );
    }
    throw new Error(`Falha ao salvar progresso: ${error.message}`);
  }
}
