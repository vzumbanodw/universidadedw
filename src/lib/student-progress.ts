import type { AdminCategory, AdminCourse, AdminLesson } from "@/types/admin";
import type { LearningPathStatus } from "@/types/learning";

/**
 * Helpers PUROS de progresso do aluno, calculados a partir do conjunto de aulas
 * concluídas (ids). Usados tanto no servidor (páginas) quanto no cliente
 * (browsers de cursos/aplicações). Conclusão é medida pelos VÍDEOS: uma aula conta
 * se está publicada e tem `videoUrl`.
 */

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
  completed: Set<string>,
): CourseCompletion {
  const vids = videoLessons(lessons, courseId);
  const total = vids.length;
  const done = vids.filter((l) => completed.has(l.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const status: LearningPathStatus =
    total > 0 && done === total ? "completed" : done > 0 ? "in_progress" : "not_started";
  return { total, done, pct, status };
}

/** Curso com `status`/`progress` reais (para o CourseCard do aluno). */
export function courseWithRealProgress(
  course: AdminCourse,
  lessons: AdminLesson[],
  completed: Set<string>,
): AdminCourse {
  const { pct, status } = courseCompletion(course.id, lessons, completed);
  return { ...course, progress: pct, status };
}

/** Um curso emite certificado quando: marcado `certificate` e 100% concluído. */
export function isCertificateEarned(
  course: AdminCourse,
  lessons: AdminLesson[],
  completed: Set<string>,
): boolean {
  if (!course.certificate) return false;
  const { total, done } = courseCompletion(course.id, lessons, completed);
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

/** Progresso agregado de uma aplicação (soma dos vídeos dos seus cursos). */
export function applicationProgress(
  categoryId: string,
  courses: AdminCourse[],
  lessons: AdminLesson[],
  completed: Set<string>,
): ApplicationProgress {
  const appCourses = courses.filter((c) => c.published && c.categoryId === categoryId);
  const courseIds = new Set(appCourses.map((c) => c.id));
  const lessonCount = lessons.filter(
    (l) => l.published && courseIds.has(l.courseId),
  ).length;

  let total = 0;
  let done = 0;
  let completedCourses = 0;
  let inProgressCourses = 0;

  for (const course of appCourses) {
    const cc = courseCompletion(course.id, lessons, completed);
    total += cc.total;
    done += cc.done;
    if (cc.status === "completed") completedCourses += 1;
    else if (cc.status === "in_progress") inProgressCourses += 1;
  }

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allComplete =
    appCourses.length > 0 && completedCourses === appCourses.length && total > 0;
  const status: LearningPathStatus = allComplete
    ? "completed"
    : done > 0
      ? "in_progress"
      : "not_started";

  return {
    pct,
    status,
    courseCount: appCourses.length,
    lessonCount,
    completedCourses,
    inProgressCourses,
  };
}

/** Categoria (aplicação) com progresso real para o TrackCategoryCard. */
export function categoryWithRealProgress(
  category: AdminCategory,
  courses: AdminCourse[],
  lessons: AdminLesson[],
  completed: Set<string>,
): AdminCategory {
  const p = applicationProgress(category.id, courses, lessons, completed);
  return {
    ...category,
    trackCount: p.courseCount,
    lessonCount: p.lessonCount,
    progressPct: p.pct,
    completed: p.completedCourses,
    inProgress: p.inProgressCourses,
  };
}
