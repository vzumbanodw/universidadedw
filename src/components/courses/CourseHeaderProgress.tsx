"use client";

import { Progress } from "@/components/ui/Progress";
import { useCourseSummary } from "@/lib/progress/ProgressProvider";

/**
 * Barra de progresso do cabeçalho da página de curso. Mostra o progresso REAL
 * do aluno (mesmo store do CoursePlayer), caindo para o valor autorado quando
 * ainda não há progresso — assim as duas barras da tela nunca divergem.
 */
export function CourseHeaderProgress({
  courseId,
  authoredProgress,
}: {
  courseId: string;
  authoredProgress: number;
}) {
  const summary = useCourseSummary(courseId);
  const value =
    summary && summary.status !== "not_started" ? summary.percent : authoredProgress;

  return (
    <Progress
      value={value}
      tone="primary"
      size="xs"
      className="mt-4"
      label="Progresso"
      showValue
    />
  );
}
