import { readContent, writeContent } from "@/lib/content/store.server";
import type { AdminLesson } from "@/types/admin";

/**
 * Service de aulas. Veja a nota de arquitetura em `./courses.ts`.
 *
 * Equivalente Supabase: tabela `lessons` com FK `course_id` (e `module_id`
 * quando módulos forem introduzidos). RLS: leitura de aulas publicadas de
 * cursos publicados; escrita restrita a operadores.
 */

export async function getLessons(): Promise<AdminLesson[]> {
  const { lessons } = await readContent();
  return [...lessons].sort((a, b) => a.order - b.order);
}

export async function getLessonsByCourse(
  courseId: string,
): Promise<AdminLesson[]> {
  const { lessons } = await readContent();
  return lessons
    .filter((lesson) => lesson.courseId === courseId)
    .sort((a, b) => a.order - b.order);
}

export async function getLessonById(id: string): Promise<AdminLesson | null> {
  const { lessons } = await readContent();
  return lessons.find((lesson) => lesson.id === id) ?? null;
}

export async function createLesson(lesson: AdminLesson): Promise<AdminLesson> {
  const state = await readContent();
  await writeContent({ ...state, lessons: [...state.lessons, lesson] });
  return lesson;
}

export async function updateLesson(lesson: AdminLesson): Promise<AdminLesson> {
  const state = await readContent();
  await writeContent({
    ...state,
    lessons: state.lessons.map((l) => (l.id === lesson.id ? lesson : l)),
  });
  return lesson;
}

export async function deleteLesson(id: string): Promise<void> {
  const state = await readContent();
  await writeContent({
    ...state,
    lessons: state.lessons.filter((lesson) => lesson.id !== id),
  });
}
