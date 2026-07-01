import type { LearningPathStatus } from "@/types/learning";

/**
 * Progresso de aprendizado POR ALUNO, mantido no cliente (localStorage).
 *
 * Hoje não existe backend de progresso por aluno (as tabelas
 * student_lesson_progress/student_course_progress são trabalho futuro — ver
 * src/lib/admin/progress.ts) e o app roda localmente sem Supabase. Este store
 * registra, no navegador do aluno, quais aulas ele começou a assistir e quais
 * concluiu, para refletir "Em andamento"/"Concluído" nos lugares devidos
 * (player, cards de curso, "Continuar de onde parou", contadores de cursos).
 *
 * É namespaced por `studentId`, então alunos diferentes no mesmo navegador não
 * se misturam. As funções de mutação são puras (recebem e devolvem um novo
 * estado) para facilitar teste e atualização imutável no provider.
 *
 * Limitação conhecida: é por dispositivo (não sincroniza entre navegadores).
 * Quando houver backend de progresso, o ProgressProvider pode hidratar do
 * servidor e escrever via API mantendo esta mesma forma de dados.
 */

export type LessonRuntimeStatus = "in_progress" | "completed";

export type LessonRecord = {
  status: LessonRuntimeStatus;
  /** Maior posição já assistida (segundos). */
  seconds: number;
  /** Duração conhecida (0 = desconhecida). */
  duration: number;
  updatedAt: number;
};

export type CourseRecord = {
  lessons: Record<string, LessonRecord>;
  /** Total de aulas do curso (informado pelo player). */
  totalLessons: number;
  updatedAt: number;
};

export type ProgressData = {
  courses: Record<string, CourseRecord>;
  /** Último curso com atividade — usado por "Continuar de onde parou". */
  lastCourseId?: string;
};

export type CourseSummary = {
  status: LearningPathStatus;
  /** 0–100. */
  percent: number;
  completedCount: number;
  startedCount: number;
  totalLessons: number;
};

const VERSION = "v1";
/** Fração assistida a partir da qual uma aula é considerada concluída. */
const COMPLETE_RATIO = 0.95;

export const EMPTY_PROGRESS: ProgressData = { courses: {} };

export function storageKey(studentId: string): string {
  return `dw:progress:${VERSION}:${studentId || "guest"}`;
}

export function loadProgress(studentId: string): ProgressData {
  if (typeof window === "undefined") return EMPTY_PROGRESS;
  try {
    const raw = window.localStorage.getItem(storageKey(studentId));
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<ProgressData> | null;
    if (!parsed || typeof parsed !== "object") return EMPTY_PROGRESS;

    // `typeof null === "object"` e arrays também são "object": rejeita ambos.
    const rawCourses = parsed.courses;
    if (!rawCourses || typeof rawCourses !== "object" || Array.isArray(rawCourses)) {
      return EMPTY_PROGRESS;
    }

    // Sanitiza cada registro; descarta os malformados (schema antigo/corrupção
    // parcial), para que os consumidores sempre recebam formas válidas.
    const courses: Record<string, CourseRecord> = {};
    for (const [id, record] of Object.entries(rawCourses)) {
      const rec = record as CourseRecord | null;
      if (
        !rec ||
        typeof rec !== "object" ||
        typeof rec.lessons !== "object" ||
        rec.lessons === null ||
        Array.isArray(rec.lessons)
      ) {
        continue;
      }
      courses[id] = {
        lessons: rec.lessons,
        totalLessons: Number.isFinite(rec.totalLessons) ? rec.totalLessons : 0,
        updatedAt: Number.isFinite(rec.updatedAt) ? rec.updatedAt : 0,
      };
    }

    return {
      courses,
      lastCourseId:
        typeof parsed.lastCourseId === "string" ? parsed.lastCourseId : undefined,
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(studentId: string, data: ProgressData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(studentId), JSON.stringify(data));
  } catch {
    // storage cheio/indisponível — ignora silenciosamente
  }
}

/** Resumo derivado do progresso de um curso (status + %). `null` se sem registro. */
export function summarize(course: CourseRecord | undefined): CourseSummary | null {
  if (!course || !course.lessons || typeof course.lessons !== "object") return null;
  const records = Object.values(course.lessons);
  const startedCount = records.length;
  const completedCount = records.filter((l) => l.status === "completed").length;
  const total = Math.max(course.totalLessons, startedCount);

  if (total > 0 && completedCount >= total) {
    return { status: "completed", percent: 100, completedCount, startedCount, totalLessons: total };
  }
  if (startedCount === 0) {
    return { status: "not_started", percent: 0, completedCount, startedCount, totalLessons: total };
  }

  // Barra "viva": conta aulas concluídas + a fração assistida das em andamento.
  let partial = 0;
  for (const l of records) {
    if (l.status === "completed") continue;
    partial += l.duration > 0 ? Math.min(Math.max(l.seconds / l.duration, 0), 0.99) : 0.15;
  }
  const percent =
    total > 0 ? Math.min(99, Math.round(((completedCount + partial) / total) * 100)) : 0;
  return { status: "in_progress", percent, completedCount, startedCount, totalLessons: total };
}

/* -------------------------------------------------------------------------- */
/* Mutações puras                                                              */
/* -------------------------------------------------------------------------- */

function withCourse(
  data: ProgressData,
  courseId: string,
  totalLessons: number,
  now: number,
): CourseRecord {
  const existing = data.courses[courseId];
  if (existing) {
    return {
      ...existing,
      totalLessons: Math.max(existing.totalLessons, totalLessons),
      updatedAt: now,
    };
  }
  return { lessons: {}, totalLessons, updatedAt: now };
}

function setLesson(
  data: ProgressData,
  courseId: string,
  lessonId: string,
  lesson: LessonRecord,
  now: number,
): ProgressData {
  const course = withCourse(data, courseId, data.courses[courseId]?.totalLessons ?? 0, now);
  return {
    ...data,
    lastCourseId: courseId,
    courses: {
      ...data.courses,
      [courseId]: {
        ...course,
        lessons: { ...course.lessons, [lessonId]: lesson },
      },
    },
  };
}

export function applyLessonStarted(
  data: ProgressData,
  courseId: string,
  lessonId: string,
  totalLessons: number,
  now: number,
): ProgressData {
  const base = withCourse(data, courseId, totalLessons, now);
  const prev = base.lessons[lessonId];
  if (prev?.status === "completed") {
    // Já concluída — só marca como curso mais recente.
    return {
      ...data,
      lastCourseId: courseId,
      courses: { ...data.courses, [courseId]: base },
    };
  }
  const lesson: LessonRecord = {
    status: "in_progress",
    seconds: prev?.seconds ?? 0,
    duration: prev?.duration ?? 0,
    updatedAt: now,
  };
  return setLesson({ ...data, courses: { ...data.courses, [courseId]: base } }, courseId, lessonId, lesson, now);
}

export function applyLessonPosition(
  data: ProgressData,
  courseId: string,
  lessonId: string,
  seconds: number,
  duration: number,
  totalLessons: number,
  now: number,
): ProgressData {
  const base = withCourse(data, courseId, totalLessons, now);
  const prev = base.lessons[lessonId];
  const safeSeconds = Number.isFinite(seconds) ? Math.max(seconds, 0) : 0;
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : prev?.duration ?? 0;
  const ratio = safeDuration > 0 ? safeSeconds / safeDuration : 0;
  const status: LessonRuntimeStatus =
    prev?.status === "completed" || ratio >= COMPLETE_RATIO ? "completed" : "in_progress";
  const lesson: LessonRecord = {
    status,
    seconds: Math.max(prev?.seconds ?? 0, safeSeconds),
    duration: safeDuration,
    updatedAt: now,
  };
  return setLesson({ ...data, courses: { ...data.courses, [courseId]: base } }, courseId, lessonId, lesson, now);
}

export function applyLessonCompleted(
  data: ProgressData,
  courseId: string,
  lessonId: string,
  totalLessons: number,
  now: number,
): ProgressData {
  const base = withCourse(data, courseId, totalLessons, now);
  const prev = base.lessons[lessonId];
  const lesson: LessonRecord = {
    status: "completed",
    seconds: prev?.seconds ?? 0,
    duration: prev?.duration ?? 0,
    updatedAt: now,
  };
  return setLesson({ ...data, courses: { ...data.courses, [courseId]: base } }, courseId, lessonId, lesson, now);
}
