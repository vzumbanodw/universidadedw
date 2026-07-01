"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Course } from "@/types/courses";
import type { LearningPathStatus } from "@/types/learning";
import {
  applyLessonCompleted,
  applyLessonPosition,
  applyLessonStarted,
  EMPTY_PROGRESS,
  loadProgress,
  saveProgress,
  storageKey,
  summarize,
  type CourseSummary,
  type LessonRuntimeStatus,
  type ProgressData,
} from "./progress-store";

type Recorder = {
  markStarted: (courseId: string, lessonId: string, totalLessons: number) => void;
  markPosition: (
    courseId: string,
    lessonId: string,
    seconds: number,
    duration: number,
    totalLessons: number,
  ) => void;
  markCompleted: (courseId: string, lessonId: string, totalLessons: number) => void;
};

type ProgressContextValue = Recorder & {
  data: ProgressData;
};

const NOOP: ProgressContextValue = {
  data: EMPTY_PROGRESS,
  markStarted: () => {},
  markPosition: () => {},
  markCompleted: () => {},
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({
  studentId,
  children,
}: {
  studentId: string;
  children: ReactNode;
}) {
  const [data, setData] = useState<ProgressData>(EMPTY_PROGRESS);

  // Hidrata do localStorage no cliente (evita mismatch de hidratação com SSR).
  useEffect(() => {
    setData(loadProgress(studentId));
  }, [studentId]);

  // Sincroniza entre abas do mesmo aluno.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === storageKey(studentId)) setData(loadProgress(studentId));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [studentId]);

  // `update` é estável (usa setState funcional), então os mutadores não mudam de
  // identidade a cada gravação — efeitos no player não re-disparam à toa.
  const update = useCallback(
    (fn: (prev: ProgressData) => ProgressData) => {
      setData((prev) => {
        const next = fn(prev);
        saveProgress(studentId, next);
        return next;
      });
    },
    [studentId],
  );

  const markStarted = useCallback<Recorder["markStarted"]>(
    (c, l, t) => update((d) => applyLessonStarted(d, c, l, t, Date.now())),
    [update],
  );
  const markPosition = useCallback<Recorder["markPosition"]>(
    (c, l, s, dur, t) => update((d) => applyLessonPosition(d, c, l, s, dur, t, Date.now())),
    [update],
  );
  const markCompleted = useCallback<Recorder["markCompleted"]>(
    (c, l, t) => update((d) => applyLessonCompleted(d, c, l, t, Date.now())),
    [update],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({ data, markStarted, markPosition, markCompleted }),
    [data, markStarted, markPosition, markCompleted],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

function useProgressContext(): ProgressContextValue {
  return useContext(ProgressContext) ?? NOOP;
}

/* -------------------------------------------------------------------------- */
/* Hooks de gravação e leitura                                                 */
/* -------------------------------------------------------------------------- */

/** Mutadores estáveis para o player registrar play/posição/conclusão. */
export function useProgressRecorder(): Recorder {
  const { markStarted, markPosition, markCompleted } = useProgressContext();
  return useMemo(
    () => ({ markStarted, markPosition, markCompleted }),
    [markStarted, markPosition, markCompleted],
  );
}

/** Resumo (status + %) do curso a partir do progresso do aluno. */
export function useCourseSummary(courseId: string): CourseSummary | null {
  const { data } = useProgressContext();
  return useMemo(() => summarize(data.courses[courseId]), [data, courseId]);
}

/** Status por aula (id -> "in_progress"|"completed") para um curso. */
export function useLessonStatuses(courseId: string): Record<string, LessonRuntimeStatus> {
  const { data } = useProgressContext();
  return useMemo(() => {
    const record = data.courses[courseId];
    if (!record || !record.lessons) return {};
    const out: Record<string, LessonRuntimeStatus> = {};
    for (const [lessonId, lesson] of Object.entries(record.lessons)) {
      out[lessonId] = lesson.status;
    }
    return out;
  }, [data, courseId]);
}

/** Posição salva (segundos) de uma aula, para retomar de onde parou. 0 se concluída/sem registro. */
export function useLessonPosition(courseId: string, lessonId: string): number {
  const { data } = useProgressContext();
  return useMemo(() => {
    const lesson = data.courses[courseId]?.lessons?.[lessonId];
    if (!lesson || lesson.status === "completed") return 0;
    return Number.isFinite(lesson.seconds) ? lesson.seconds : 0;
  }, [data, courseId, lessonId]);
}

/** Sobrepõe o progresso do aluno sobre os cursos autorados (status + progress). */
export function useCoursesWithProgress(courses: Course[]): Course[] {
  const { data } = useProgressContext();
  return useMemo(
    () =>
      courses.map((course) => {
        const summary = summarize(data.courses[course.id]);
        if (!summary || summary.status === "not_started") return course;
        return { ...course, status: summary.status, progress: summary.percent };
      }),
    [courses, data],
  );
}

/** Curso a retomar em "Continuar de onde parou", priorizando o progresso real. */
export function useContinueCourse(courses: Course[]): Course | undefined {
  const { data } = useProgressContext();
  return useMemo(() => {
    const overlay = (id: string): Course | undefined => {
      const course = courses.find((c) => c.id === id);
      if (!course) return undefined;
      const summary = summarize(data.courses[id]);
      return summary && summary.status !== "not_started"
        ? { ...course, status: summary.status, progress: summary.percent }
        : course;
    };

    // 1) Último curso com atividade, se ainda estiver em andamento.
    if (data.lastCourseId) {
      const last = overlay(data.lastCourseId);
      if (last && last.status === "in_progress") return last;
    }

    // 2) Qualquer curso em andamento pelo progresso real, mais recente primeiro.
    const runtimeInProgress = Object.entries(data.courses)
      .map(([id, record]) => ({ id, record, summary: summarize(record) }))
      .filter((x) => x.summary?.status === "in_progress")
      .sort((a, b) => b.record.updatedAt - a.record.updatedAt)[0];
    if (runtimeInProgress) {
      const course = overlay(runtimeInProgress.id);
      if (course) return course;
    }

    // 3) Fallback autorado: em andamento com maior progresso, senão o primeiro.
    const authored = [...courses]
      .filter((c) => c.status === "in_progress")
      .sort((a, b) => b.progress - a.progress)[0];
    return authored ?? courses[0];
  }, [courses, data]);
}

/** Conta cursos cujo status efetivo (progresso real ou autorado) casa com `match`. */
export function useCourseCount(
  courses: { id: string; status: LearningPathStatus }[],
  match: LearningPathStatus,
): number {
  const { data } = useProgressContext();
  return useMemo(
    () =>
      courses.reduce((count, course) => {
        const summary = summarize(data.courses[course.id]);
        const effective =
          summary && summary.status !== "not_started" ? summary.status : course.status;
        return effective === match ? count + 1 : count;
      }, 0),
    [courses, data, match],
  );
}
