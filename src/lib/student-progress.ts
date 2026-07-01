import type { AdminCategory, AdminCourse, AdminLesson } from "@/types/admin";
import type { LearningPathStatus } from "@/types/learning";

/**
 * Helpers PUROS de progresso do aluno, calculados a partir do PROGRESSO POR AULA
 * (mapa `lessonId -> percent`, 0–100). O progresso é medido pelos VÍDEOS: uma
 * aula conta se está publicada e tem `videoUrl`.
 *
 * A % do curso é a média das % das suas aulas-vídeo; a da aplicação, a média das
 * aulas-vídeo de todos os seus cursos. "Concluída" = percent >= COMPLETE_THRESHOLD.
 */

/** Percentual a partir do qual a aula é considerada concluída. */
export const COMPLETE_THRESHOLD = 95;

/** Mapa de progresso do aluno: id da aula → % assistida (0–100). */
export type LessonProgressMap = Map<string, number>;

function pctOf(progress: LessonProgressMap, lessonId: string): number {
  const value = progress.get(lessonId) ?? 0;
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export type CourseCompletion = {
  total: number;
  done: number;
  pct: number;
  status: LearningPathStatus;
};

/** Aulas-vídeo publicadas de um curso. */
export function videoLessons(lessons: AdminLesson[], courseId: string): AdminLesson[] {
  return lessons.filter(
    (l) => l.courseId === courseId && l.published && Boolean(l.videoUrl),
  );
}

export function courseCompletion(
  courseId: string,
  lessons: AdminLesson[],
  progress: LessonProgressMap,
): CourseCompletion {
  const vids = videoLessons(lessons, courseId);
  const total = vids.length;
  let sum = 0;
  let done = 0;
  for (const lesson of vids) {
    const p = pctOf(progress, lesson.id);
    sum += p;
    if (p >= COMPLETE_THRESHOLD) done += 1;
  }
  const pct = total > 0 ? Math.round(sum / total) : 0;
  const status: LearningPathStatus =
    total > 0 && done === total ? "completed" : sum > 0 ? "in_progress" : "not_started";
  return { total, done, pct, status };
}

/** Curso com `status`/`progress` reais (para o CourseCard do aluno). */
export function courseWithRealProgress(
  course: AdminCourse,
  lessons: AdminLesson[],
  progress: LessonProgressMap,
): AdminCourse {
  const { pct, status } = courseCompletion(course.id, lessons, progress);
  return { ...course, progress: pct, status };
}

/** Um curso emite certificado quando: marcado `certificate` e 100% concluído. */
export function isCertificateEarned(
  course: AdminCourse,
  lessons: AdminLesson[],
  progress: LessonProgressMap,
): boolean {
  if (!course.certificate) return false;
  const { total, done } = courseCompletion(course.id, lessons, progress);
  return total > 0 && done === total;
}

export type ApplicationProgress = {
  pct: number;
  status: LearningPathStatus;
  courseCount: number;
  lessonCount: number;
  completedCourses: number;
  inProgressCourses: number;
};

/** Progresso agregado de uma aplicação (média dos vídeos dos seus cursos). */
export function applicationProgress(
  categoryId: string,
  courses: AdminCourse[],
  lessons: AdminLesson[],
  progress: LessonProgressMap,
): ApplicationProgress {
  const appCourses = courses.filter((c) => c.published && c.categoryId === categoryId);
  const courseIds = new Set(appCourses.map((c) => c.id));
  const appVideoLessons = lessons.filter(
    (l) => l.published && Boolean(l.videoUrl) && courseIds.has(l.courseId),
  );

  const total = appVideoLessons.length;
  let sum = 0;
  for (const lesson of appVideoLessons) sum += pctOf(progress, lesson.id);

  let completedCourses = 0;
  let inProgressCourses = 0;
  for (const course of appCourses) {
    const cc = courseCompletion(course.id, lessons, progress);
    if (cc.status === "completed") completedCourses += 1;
    else if (cc.status === "in_progress") inProgressCourses += 1;
  }

  const pct = total > 0 ? Math.round(sum / total) : 0;
  const allComplete =
    appCourses.length > 0 && completedCourses === appCourses.length && total > 0;
  const status: LearningPathStatus = allComplete
    ? "completed"
    : sum > 0
      ? "in_progress"
      : "not_started";

  return {
    pct,
    status,
    courseCount: appCourses.length,
    lessonCount: appVideoLessons.length,
    completedCourses,
    inProgressCourses,
  };
}

/** Categoria (aplicação) com progresso real para o TrackCategoryCard. */
export function categoryWithRealProgress(
  category: AdminCategory,
  courses: AdminCourse[],
  lessons: AdminLesson[],
  progress: LessonProgressMap,
): AdminCategory {
  const p = applicationProgress(category.id, courses, lessons, progress);
  return {
    ...category,
    trackCount: p.courseCount,
    lessonCount: p.lessonCount,
    progressPct: p.pct,
    completed: p.completedCourses,
    inProgress: p.inProgressCourses,
  };
}
