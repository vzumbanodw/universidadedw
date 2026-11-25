import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseServiceClient,
  hasServiceRole,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  MIN_COMPLETED_LESSONS,
  SURVEY_ID,
  nextSurveyDate,
  type SurveyAnswers,
  type SurveyResponse,
  type SurveyStatus,
} from "@/lib/satisfaction/survey";

/**
 * Respostas da Pesquisa de Satisfação em `satisfaction_responses` (migrações
 * 0015 + 0016). Tabela própria, fora do documento de conteúdo — o backoffice
 * regrava aquele documento a cada salvamento, e respostas não podem se perder.
 *
 * Cada envio é um registro novo (`response_round` = 1ª, 2ª… resposta da pessoa).
 *
 * Tolerante à tabela/coluna ausente: sem as migrações, o modal simplesmente
 * não aparece (em vez de aparecer obrigatório e falhar ao enviar).
 */

const TABLE = "satisfaction_responses";
const UNIQUE_VIOLATION = "23505";

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

type LastResponse = { round: number; createdAt: string } | null;

/** Resposta mais recente da pessoa na pesquisa atual. Lança erro se a consulta falhar. */
async function getLastResponse(studentId: string): Promise<LastResponse> {
  const { data, error } = await db()
    .from(TABLE)
    .select("response_round, created_at")
    .eq("survey_id", SURVEY_ID)
    .eq("student_id", studentId)
    .order("response_round", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    round: Number(data.response_round ?? 1),
    createdAt: String(data.created_at),
  };
}

/** Quantas aulas a pessoa já concluiu (vídeo >= 95%, ver progress.server.ts). */
async function countCompletedLessons(studentId: string): Promise<number> {
  const { count, error } = await db()
    .from("lesson_completions")
    .select("lesson_id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .not("completed_at", "is", null);
  if (error) throw error;
  return count ?? 0;
}

/** A pesquisa deve aparecer (obrigatória) para esta pessoa agora? */
export async function getSurveyStatus(
  studentId: string | null | undefined,
): Promise<SurveyStatus> {
  if (!studentId || !available()) return "unavailable";
  try {
    const [last, completed] = await Promise.all([
      getLastResponse(studentId),
      countCompletedLessons(studentId),
    ]);
    if (last && Date.now() < nextSurveyDate(last.createdAt).getTime()) {
      return "answered";
    }
    return completed >= MIN_COMPLETED_LESSONS ? "pending" : "not_eligible";
  } catch {
    // Migração ausente, coluna nova ainda não criada, falha de rede: não
    // trava o aluno atrás de um formulário obrigatório que não salvaria.
    return "unavailable";
  }
}

/**
 * Grava uma nova resposta (nova rodada). Idempotente dentro da janela de
 * renovação: um segundo envio (duplo clique, outra aba) não cria outro registro.
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

  let last: LastResponse;
  try {
    last = await getLastResponse(student.id);
  } catch (error) {
    if (isMissingTable(error as { code?: string; message?: string })) {
      throw new Error(
        "A tabela da pesquisa ainda não existe. Rode as migrations 0015 e 0016 no Supabase.",
      );
    }
    throw new Error(`Falha ao salvar a resposta: ${(error as Error).message}`);
  }

  // Já respondeu nesta rodada: considera enviado, sem duplicar o registro.
  if (last && Date.now() < nextSurveyDate(last.createdAt).getTime()) return;

  const { error } = await db()
    .from(TABLE)
    .insert({
      survey_id: SURVEY_ID,
      student_id: student.id,
      response_round: (last?.round ?? 0) + 1,
      student_name: student.name,
      student_email: student.email.toLowerCase(),
      company_id: student.companyId ?? null,
      company_name: student.companyName ?? null,
      most_helpful_lesson: answers.mostHelpfulLesson || null,
      missing_topic: answers.missingTopic || null,
      ease_rating: answers.easeRating,
      improvement: answers.improvement || null,
    });

  // Dois envios simultâneos da mesma rodada: o índice único barra o segundo.
  if (error && error.code !== UNIQUE_VIOLATION) {
    throw new Error(`Falha ao salvar a resposta: ${error.message}`);
  }
}

/**
 * Remove UMA resposta (backoffice) — ex.: respostas de teste do time. Se era a
 * mais recente da pessoa, a pesquisa volta a aparecer na próxima entrada
 * (desde que ela tenha as aulas concluídas exigidas).
 */
export async function deleteSurveyResponse(responseId: string): Promise<void> {
  if (!available()) {
    throw new Error("Pesquisa indisponível: SUPABASE_SERVICE_ROLE_KEY ausente.");
  }
  const { error } = await db()
    .from(TABLE)
    .delete()
    .eq("survey_id", SURVEY_ID)
    .eq("id", responseId);
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
      id: String(r.id ?? `${r.student_id}-${r.created_at}`),
      round: Number(r.response_round ?? 1),
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
