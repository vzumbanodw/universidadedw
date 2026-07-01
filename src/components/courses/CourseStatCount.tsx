"use client";

import { useCourseCount } from "@/lib/progress/ProgressProvider";
import type { LearningPathStatus } from "@/types/learning";

/**
 * Ilha client que exibe a contagem de cursos por status efetivo (progresso real
 * do aluno com fallback para o valor autorado). Renderiza só o número, para ser
 * usado dentro de tiles/métricas renderizadas no servidor.
 */
export function CourseStatCount({
  courses,
  match,
}: {
  courses: { id: string; status: LearningPathStatus }[];
  match: LearningPathStatus;
}) {
  const count = useCourseCount(courses, match);
  return <>{count}</>;
}
