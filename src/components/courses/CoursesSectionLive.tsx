"use client";

import { CoursesSection } from "./CoursesSection";
import { useCoursesWithProgress } from "@/lib/progress/ProgressProvider";
import type { Course } from "@/types/courses";

/**
 * Wrapper client do CoursesSection que sobrepõe o progresso real do aluno sobre
 * os cursos autorados antes de renderizar os cards. Usado em páginas server
 * (ex.: detalhe da trilha) para que o status "Em andamento"/"Concluído" e a
 * barra de progresso reflitam o que o aluno assistiu.
 */
export function CoursesSectionLive({
  eyebrow,
  title,
  description,
  courses,
  seeAllHref,
}: {
  eyebrow: string;
  title: string;
  description: string;
  courses: Course[];
  seeAllHref?: string;
}) {
  const liveCourses = useCoursesWithProgress(courses);
  return (
    <CoursesSection
      eyebrow={eyebrow}
      title={title}
      description={description}
      courses={liveCourses}
      seeAllHref={seeAllHref}
    />
  );
}
