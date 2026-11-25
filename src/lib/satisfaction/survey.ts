/**
 * Pesquisa de Satisfação do Universidade — definição compartilhada entre o
 * modal do aluno, a API e o backoffice (perguntas, tipos, regras e validação).
 *
 * Regras de exibição:
 *  • só aparece para quem já concluiu pelo menos `MIN_COMPLETED_LESSONS` aulas;
 *  • quando aparece, é obrigatória (não dá para adiar nem fechar);
 *  • depois de respondida, só volta `RENEWAL_MONTHS` meses após a última
 *    resposta — e cada envio vira um novo registro no backoffice.
 *
 * `SURVEY_ID` identifica a edição do questionário: trocar as perguntas usa um
 * novo id, sem misturar respostas com a versão anterior.
 */

export const SURVEY_ID = "satisfacao-2026";

/** Aulas concluídas (vídeo >= 95%) necessárias para a pesquisa aparecer. */
export const MIN_COMPLETED_LESSONS = 2;

/** Intervalo entre uma resposta e a próxima vez que a pesquisa aparece. */
export const RENEWAL_MONTHS = 3;

/** Data a partir da qual a pessoa volta a ver a pesquisa, dada a última resposta. */
export function nextSurveyDate(lastAnsweredAt: string | Date): Date {
  const date = new Date(lastAnsweredAt);
  const day = date.getUTCDate();
  date.setUTCMonth(date.getUTCMonth() + RENEWAL_MONTHS);
  // 30/11 + 3 meses = 30/02 → o JS rolaria para março; fixa no último dia do mês.
  if (date.getUTCDate() !== day) date.setUTCDate(0);
  return date;
}

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
  id: string;
  /** 1ª, 2ª, 3ª… resposta desta pessoa. */
  round: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  companyId?: string;
  companyName?: string;
  createdAt: string;
};

/**
 * pending = deve responder agora (modal obrigatório)
 * answered = respondeu há menos de RENEWAL_MONTHS meses
 * not_eligible = ainda não concluiu MIN_COMPLETED_LESSONS aulas
 * unavailable = tabela/serviço ausente (a pesquisa fica desligada)
 */
export type SurveyStatus = "pending" | "answered" | "not_eligible" | "unavailable";

/** Faixa da nota de navegação — mesma leitura no modal e no backoffice. */
export function ratingTone(rating: number): "low" | "mid" | "high" {
  if (rating <= 4) return "low";
  if (rating <= 7) return "mid";
  return "high";
}

/** Campo que faltou (para o modal focar) e a mensagem exibida. */
export type SurveyFieldError = {
  field: keyof SurveyAnswers;
  message: string;
};

const REQUIRED_TEXT_MESSAGES = {
  mostHelpfulLesson: "Conte qual aula mais ajudou você.",
  missingTopic: "Conte que aula ou assunto você sente falta.",
  improvement: "Conte o que podemos melhorar.",
} as const;

/**
 * Valida as respostas — TODAS as perguntas são obrigatórias. Usada no modal
 * (antes de enviar) e na API (a regra vale mesmo sem passar pela tela).
 * Devolve o primeiro campo pendente, na ordem das perguntas.
 */
export function validateSurveyAnswers(answers: {
  mostHelpfulLesson: string;
  missingTopic: string;
  easeRating: number | null;
  improvement: string;
}): SurveyFieldError | null {
  if (!answers.mostHelpfulLesson.trim()) {
    return { field: "mostHelpfulLesson", message: REQUIRED_TEXT_MESSAGES.mostHelpfulLesson };
  }
  if (!answers.missingTopic.trim()) {
    return { field: "missingTopic", message: REQUIRED_TEXT_MESSAGES.missingTopic };
  }
  const rating = answers.easeRating;
  if (rating === null || !Number.isInteger(rating) || rating < RATING_MIN || rating > RATING_MAX) {
    return { field: "easeRating", message: "Escolha uma nota de 1 a 10 para a navegação." };
  }
  if (!answers.improvement.trim()) {
    return { field: "improvement", message: REQUIRED_TEXT_MESSAGES.improvement };
  }
  return null;
}

/** Normaliza e valida o corpo enviado pelo modal. */
export function parseSurveyAnswers(
  input: unknown,
): { ok: true; answers: SurveyAnswers } | { ok: false; error: string } {
  const body = (input ?? {}) as Record<string, unknown>;
  const text = (value: unknown) =>
    typeof value === "string" ? value.trim().slice(0, TEXT_MAX) : "";
  const answers: SurveyAnswers = {
    mostHelpfulLesson: text(body.mostHelpfulLesson),
    missingTopic: text(body.missingTopic),
    easeRating: Number(body.easeRating),
    improvement: text(body.improvement),
  };
  const invalid = validateSurveyAnswers(answers);
  if (invalid) return { ok: false, error: invalid.message };
  return { ok: true, answers };
}
