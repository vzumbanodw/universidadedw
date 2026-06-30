import { readContent } from "@/lib/content/store.server";
import type { AdminLesson } from "@/types/admin";
import type { CourseModuleRow } from "@/lib/supabase/types";

/**
 * Service de módulos.
 *
 * No protótipo atual, os cursos têm aulas em lista plana (sem um nível
 * intermediário de módulo) — então ainda não há uma coleção de módulos no
 * store. Este service deixa a API pronta para a tabela `course_modules`:
 * quando ela existir, as aulas passam a referenciar `module_id` e estas
 * funções consultam/gravam módulos de verdade.
 *
 * RLS: idêntica às aulas (leitura pública de módulos publicados; escrita só
 * para operadores).
 */

export type CourseModule = Pick<
  CourseModuleRow,
  "id" | "course_id" | "title" | "description" | "sort_order" | "status"
>;

export async function getModulesByCourse(
  courseId: string,
): Promise<CourseModule[]> {
  // Ainda não há tabela de módulos: retorna vazio mantendo o contrato.
  // Supabase: supabase.from("course_modules").select("*")
  //   .eq("course_id", courseId).order("sort_order");
  void courseId;
  return [];
}

/** Agrupa as aulas de um curso por módulo (todas em "sem módulo" por enquanto). */
export async function getLessonsGroupedByModule(
  courseId: string,
): Promise<{ module: CourseModule | null; lessons: AdminLesson[] }[]> {
  const { lessons } = await readContent();
  const courseLessons = lessons
    .filter((lesson) => lesson.courseId === courseId)
    .sort((a, b) => a.order - b.order);
  return [{ module: null, lessons: courseLessons }];
}

export async function createModule(
  module: CourseModule,
): Promise<CourseModule> {
  // TODO(supabase): insert em `course_modules`.
  return module;
}

export async function updateModule(
  module: CourseModule,
): Promise<CourseModule> {
  // TODO(supabase): update em `course_modules`.
  return module;
}

export async function deleteModule(id: string): Promise<void> {
  // TODO(supabase): delete em `course_modules` (e desvincular aulas).
  void id;
}
