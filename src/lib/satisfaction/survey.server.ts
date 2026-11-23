import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseServiceClient,
  hasServiceRole,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  SURVEY_ID,
  type SurveyAnswers,
  type SurveyResponse,
  type SurveyStatus,
} from "@/lib/satisfaction/survey";

/**
 * Respostas da Pesquisa de Satisfação em `satisfaction_responses` (migração
 * 0015). Tabela própria, fora do documento de conteúdo — o backoffice regrava
 * aquele documento a cada salvamento, e respostas não podem se perder.
 *
 * Tolerante à tabela ausente: sem a migração, o modal simplesmente não aparece
 * (em vez de aparecer sempre e falhar ao enviar).
 */

const TABLE = "satisfaction_responses";

function db(): SupabaseClient {
  return createSupabaseServiceClient() as unknown as SupabaseClient;
}

function available(): boolean {
  return isSupabaseConfigured() && hasServiceRole();
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

/** O aluno ainda precisa responder a pesquisa atual? */
export async function getSurveyStatus(
  studentId: string | null | undefined,
): Promise<SurveyStatus> {
  if (!studentId || !available()) return "unavailable";
  try {
    const { data, error } = await db()
      .from(TABLE)
      .select("student_id")
      .eq("survey_id", SURVEY_ID)
      .eq("student_id", studentId)
      .maybeSingle();
    if (error) return "unavailable";
    return data ? "answered" : "pending";
  } catch {
    return "unavailable";
  }
}

/**
 * Grava a resposta. Idempotente: um segundo envio (duplo clique, outra aba)
 * não sobrescreve a primeira resposta.
 */
export async function saveSurveyResponse(
  student: {
    id: string;
    name: string;
    email: string;
    companyId?: string;
    companyName?: string;
  },
  answers: SurveyAnswers,
): Promise<void> {
  if (!available()) {
    throw new Error("Pesquisa indisponível: SUPABASE_SERVICE_ROLE_KEY ausente.");
  }
  const { error } = await db()
    .from(TABLE)
    .upsert(
      {
        survey_id: SURVEY_ID,
        student_id: student.id,
        student_name: student.name,
        student_email: student.email.toLowerCase(),
        company_id: student.companyId ?? null,
        company_name: student.companyName ?? null,
        most_helpful_lesson: answers.mostHelpfulLesson || null,
        missing_topic: answers.missingTopic || null,
        ease_rating: answers.easeRating,
        improvement: answers.improvement || null,
      },
      { onConflict: "survey_id,student_id", ignoreDuplicates: true },
    );
  if (error) {
    if (isMissingTable(error)) {
      throw new Error(
        "A tabela da pesquisa ainda não existe. Rode a migration 0015 no Supabase.",
      );
    }
    throw new Error(`Falha ao salvar a resposta: ${error.message}`);
  }
}

/**
 * Remove a resposta de uma pessoa na pesquisa atual (backoffice). Serve para
 * limpar respostas de teste: a pessoa volta a ver o formulário na próxima
 * entrada.
 */
export async function deleteSurveyResponse(studentId: string): Promise<void> {
  if (!available()) {
    throw new Error("Pesquisa indisponível: SUPABASE_SERVICE_ROLE_KEY ausente.");
  }
  const { error } = await db()
    .from(TABLE)
    .delete()
    .eq("survey_id", SURVEY_ID)
    .eq("student_id", studentId);
  if (error) throw new Error(`Falha ao remover a resposta: ${error.message}`);
}

/** Todas as respostas da pesquisa atual (backoffice), mais recentes primeiro. */
export async function listSurveyResponses(): Promise<{
  responses: SurveyResponse[];
  missingTable: boolean;
}> {
  if (!available()) return { responses: [], missingTable: false };
  const { data, error } = await db()
    .from(TABLE)
    .select("*")
    .eq("survey_id", SURVEY_ID)
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingTable(error)) return { responses: [], missingTable: true };
    throw new Error(`Falha ao carregar as respostas: ${error.message}`);
  }
  return {
    missingTable: false,
    responses: (data ?? []).map((r: Record<string, unknown>) => ({
      studentId: String(r.student_id ?? ""),
      studentName: String(r.student_name ?? ""),
      studentEmail: String(r.student_email ?? ""),
      companyId: r.company_id ? String(r.company_id) : undefined,
      companyName: r.company_name ? String(r.company_name) : undefined,
      mostHelpfulLesson: String(r.most_helpful_lesson ?? ""),
      missingTopic: String(r.missing_topic ?? ""),
      easeRating: Number(r.ease_rating ?? 0),
      improvement: String(r.improvement ?? ""),
      createdAt: String(r.created_at ?? ""),
    })),
  };
}
