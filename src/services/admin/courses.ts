import { readContent, writeContent } from "@/lib/content/store.server";
import type { AdminCourse } from "@/types/admin";

/**
 * Service de cursos — camada de dados isolada dos componentes.
 *
 * Hoje lê/grava no store de conteúdo do servidor (`/.data/content.json`).
 * Quando o Supabase estiver conectado, troque o corpo de cada função pela
 * consulta equivalente — a assinatura pública não muda, então nenhuma tela
 * precisa ser reescrita.
 *
 * Equivalente Supabase (exemplo):
 *   const supabase = createSupabaseServerClient();
 *   const { data } = await supabase.from("courses").select("*")
 *     .order("sort_order");
 *
 * RLS: leitura liberada para cursos publicados; escrita restrita a operadores
 * (`admin_users.role in ('super_admin','admin','content_manager')`).
 */

export async function getCourses(): Promise<AdminCourse[]> {
  const { courses } = await readContent();
  return courses;
}

export async function getCourseById(id: string): Promise<AdminCourse | null> {
  const { courses } = await readContent();
  return courses.find((course) => course.id === id) ?? null;
}

export async function createCourse(course: AdminCourse): Promise<AdminCourse> {
  const state = await readContent();
  await writeContent({ ...state, courses: [...state.courses, course] });
  return course;
}

export async function updateCourse(course: AdminCourse): Promise<AdminCourse> {
  const state = await readContent();
  await writeContent({
    ...state,
    courses: state.courses.map((c) => (c.id === course.id ? course : c)),
  });
  return course;
}

/** Arquiva sem apagar: muda o status e remove da publicação. */
export async function archiveCourse(id: string): Promise<void> {
  const state = await readContent();
  await writeContent({
    ...state,
    courses: state.courses.map((c) =>
      c.id === id ? { ...c, published: false, status: "not_started" } : c,
    ),
  });
}

export async function deleteCourse(id: string): Promise<void> {
  const state = await readContent();
  await writeContent({
    ...state,
    courses: state.courses.filter((c) => c.id !== id),
    lessons: state.lessons.filter((lesson) => lesson.courseId !== id),
  });
}
