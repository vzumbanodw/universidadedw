/**
 * Pesquisa de Satisfação do Universidade — definição compartilhada entre o
 * modal do aluno, a API e o backoffice (perguntas, tipos e validação).
 *
 * `SURVEY_ID` identifica a edição da pesquisa: uma futura rodada usa um novo id
 * e volta a ser exibida a todos, sem misturar respostas com a anterior.
 */

export const SURVEY_ID = "satisfacao-2026";

export const SURVEY_QUESTIONS = {
  mostHelpfulLesson: "Qual aula da Universidade Dataweb mais ajudou você?",
  missingTopic: "Que aula ou assunto você sente falta na Universidade Dataweb?",
  easeRating: "Como você avalia a facilidade de navegação na Universidade Dataweb?",
  improvement: "O que podemos melhorar para facilitar ainda mais a sua experiência?",
} as const;

/** Rótulos curtos para o backoffice e para a exportação. */
export const SURVEY_SHORT_LABELS = {
  mostHelpfulLesson: "Aula que mais ajudou",
  missingTopic: "Sente falta de",
  easeRating: "Facilidade de navegação",
  improvement: "Sugestão de melhoria",
} as const;

export const RATING_MIN = 1;
export const RATING_MAX = 10;
export const TEXT_MAX = 1500;

export type SurveyAnswers = {
  mostHelpfulLesson: string;
  missingTopic: string;
  easeRating: number;
  improvement: string;
};

export type SurveyResponse = SurveyAnswers & {
  studentId: string;
  studentName: string;
  studentEmail: string;
  companyId?: string;
  companyName?: string;
  createdAt: string;
};

/** pending = deve ver o modal · answered = já respondeu · unavailable = tabela/serviço ausente. */
export type SurveyStatus = "pending" | "answered" | "unavailable";

/** Faixa da nota de navegação — mesma leitura no modal e no backoffice. */
export function ratingTone(rating: number): "low" | "mid" | "high" {
  if (rating <= 4) return "low";
  if (rating <= 7) return "mid";
  return "high";
}

/** Normaliza e valida o corpo enviado pelo modal. Só a nota é obrigatória. */
export function parseSurveyAnswers(
  input: unknown,
): { ok: true; answers: SurveyAnswers } | { ok: false; error: string } {
  const body = (input ?? {}) as Record<string, unknown>;
  const rating = Number(body.easeRating);
  if (!Number.isInteger(rating) || rating < RATING_MIN || rating > RATING_MAX) {
    return { ok: false, error: "Escolha uma nota de 1 a 10 para a navegação." };
  }
  const text = (value: unknown) =>
    typeof value === "string" ? value.trim().slice(0, TEXT_MAX) : "";
  return {
    ok: true,
    answers: {
      mostHelpfulLesson: text(body.mostHelpfulLesson),
      missingTopic: text(body.missingTopic),
      easeRating: rating,
      improvement: text(body.improvement),
    },
  };
}
