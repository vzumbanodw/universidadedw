"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  ListChecks,
  Play,
  PlayCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";
import { formatMinutes } from "@/lib/formatters";
import { getVideoEmbed } from "@/lib/video";
import { YouTubePlayer } from "@/components/courses/YouTubePlayer";
import type { Course, CourseLesson } from "@/types/courses";

type CoursePlayerProps = {
  course: Course;
  lessons: CourseLesson[];
  /** Ids das aulas já concluídas por este aluno (progresso real). */
  initialCompletedIds?: string[];
};

const RESOURCE_ICON = {
  PDF: FileText,
  Checklist: ListChecks,
  Exercicio: BookOpen,
} as const;

export function CoursePlayer({
  course,
  lessons,
  initialCompletedIds = [],
}: CoursePlayerProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(initialCompletedIds),
  );
  const [flashDone, setFlashDone] = useState(false);

  const firstOpenLesson = useMemo(() => {
    const set = new Set(initialCompletedIds);
    const index = lessons.findIndex((lesson) => !set.has(lesson.id));
    return index === -1 ? 0 : index;
  }, [lessons, initialCompletedIds]);

  const [selectedIndex, setSelectedIndex] = useState(firstOpenLesson);
  const selectedLesson = lessons[selectedIndex] ?? lessons[0]!;
  const selectedCompleted = completedIds.has(selectedLesson.id);
  const completedCount = lessons.filter((l) => completedIds.has(l.id)).length;
  const videoCount = lessons.filter((l) => l.videoUrl).length;
  const doneVideoCount = lessons.filter(
    (l) => l.videoUrl && completedIds.has(l.id),
  ).length;
  const livePct = videoCount > 0 ? Math.round((doneVideoCount / videoCount) * 100) : 0;
  const selectedNumber = selectedIndex + 1;
  const embed = getVideoEmbed(selectedLesson.videoUrl);

  async function markComplete(lessonId: string) {
    if (completedIds.has(lessonId)) return;
    setCompletedIds((prev) => new Set(prev).add(lessonId));
    setFlashDone(true);
    window.setTimeout(() => setFlashDone(false), 4000);
    try {
      await fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
    } catch {
      /* offline: segue marcado localmente; tenta de novo no próximo fim de vídeo */
    }
  }

  function goTo(delta: number) {
    setSelectedIndex((current) =>
      Math.max(0, Math.min(lessons.length - 1, current + delta)),
    );
  }

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="overflow-hidden rounded-medium border border-border-subtle bg-background-elevated shadow-elevation-sm">
          {embed ? (
            <>
              <div className="relative aspect-video w-full bg-black">
                {embed.kind === "youtube" ? (
                  <YouTubePlayer
                    key={embed.id}
                    id={embed.id}
                    title={selectedLesson.title}
                    onEnded={() => markComplete(selectedLesson.id)}
                  />
                ) : embed.kind === "iframe" ? (
                  <iframe
                    key={embed.src}
                    src={embed.src}
                    title={selectedLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                ) : (
                  <video
                    key={embed.src}
                    src={embed.src}
                    controls
                    onEnded={() => markComplete(selectedLesson.id)}
                    className="absolute inset-0 h-full w-full bg-black"
                  />
                )}

                {flashDone ? (
                  <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 animate-fade-in-up">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green/95 px-3 py-1.5 text-[12.5px] font-semibold text-white shadow-elevation-lg">
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                      Aula concluída
                    </span>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5 border-t border-border-subtle px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary" size="sm">
                    Aula {selectedNumber}
                  </Badge>
                  <Badge variant={selectedCompleted ? "success" : "orange"} size="sm" dot>
                    {selectedCompleted ? "Concluída" : "Em andamento"}
                  </Badge>
                  <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-foreground-muted">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {formatMinutes(selectedLesson.durationMinutes)}
                  </span>
                </div>
                <h2 className="text-[18px] font-semibold leading-snug tracking-tight text-foreground-heading">
                  {selectedLesson.title}
                </h2>
                {selectedLesson.description ? (
                  <p className="text-[13px] leading-relaxed text-foreground-muted">
                    {selectedLesson.description}
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="relative aspect-video min-h-[240px] overflow-hidden bg-brand-dark">
              <div aria-hidden className="absolute inset-0 bg-grid-pattern opacity-70" />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  backgroundImage: [
                    "radial-gradient(60% 60% at 20% 20%, rgba(0, 160, 177, 0.28), transparent 70%)",
                    "radial-gradient(45% 50% at 90% 90%, rgba(251, 176, 64, 0.18), transparent 72%)",
                    "linear-gradient(135deg, rgba(7, 17, 28, 0.10), rgba(7, 17, 28, 0.86))",
                  ].join(", "),
                }}
              />
              <div className="relative flex h-full min-h-[240px] flex-col justify-between p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary" size="sm">
                    Aula {selectedNumber}
                  </Badge>
                  <Badge variant={selectedCompleted ? "success" : "orange"} size="sm" dot>
                    {selectedCompleted ? "Concluída" : "Em andamento"}
                  </Badge>
                </div>

                <div className="flex flex-col items-start gap-5 sm:max-w-[72%]">
                  <span
                    aria-hidden
                    className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white shadow-elevation-lg backdrop-blur-md"
                  >
                    <Play className="ml-1 h-7 w-7 fill-current" aria-hidden />
                  </span>
                  <div>
                    <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.16em] text-white/55">
                      {course.categoryName} · {course.format}
                    </p>
                    <h2 className="text-balance text-[24px] font-semibold leading-tight tracking-tight text-white sm:text-[30px]">
                      {selectedLesson.title}
                    </h2>
                    <p className="mt-2 max-w-[64ch] text-[14px] leading-relaxed text-white/70">
                      {selectedLesson.description}
                    </p>
                    <p className="mt-3 text-[12px] text-white/50">
                      Sem vídeo nesta aula. Adicione a URL do YouTube no backoffice.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[12px] text-white/65">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {formatMinutes(selectedLesson.durationMinutes)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <PlayCircle className="h-3.5 w-3.5" aria-hidden />
                    Videoaula
                  </span>
                  {course.certificate ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5" aria-hidden />
                      Curso com certificado
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        <article className="rounded-medium border border-border-subtle bg-background-elevated p-5 shadow-elevation-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-muted">
                Conteúdo da aula
              </p>
              <h3 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground-heading">
                {selectedLesson.contentTitle}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                disabled={selectedIndex === 0}
                onClick={() => goTo(-1)}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                disabled={selectedIndex === lessons.length - 1}
                onClick={() => goTo(1)}
              >
                Próxima
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-3 text-[14px] leading-relaxed text-foreground-subtitle">
              {selectedLesson.contentBlocks.map((block) => (
                <p key={block}>{block}</p>
              ))}
              <div className="mt-5 rounded-regular border border-border-subtle bg-background-subtle p-4">
                <h4 className="text-[13px] font-semibold tracking-tight text-foreground-heading">
                  Ao concluir esta aula
                </h4>
                <ul className="mt-3 grid gap-2 text-[13px] text-foreground-muted">
                  <Outcome>Identificar o melhor ponto de aplicação na rotina.</Outcome>
                  <Outcome>Executar o fluxo principal sem depender de suporte.</Outcome>
                  <Outcome>Registrar ajustes para padronização da equipe.</Outcome>
                </ul>
              </div>
            </div>

            <aside className="rounded-regular border border-border-subtle bg-surface-muted/40 p-4">
              <h4 className="text-[13px] font-semibold tracking-tight text-foreground-heading">
                Materiais
              </h4>
              <div className="mt-3 flex flex-col gap-2">
                {selectedLesson.resources.map((resource) => {
                  const ResourceIcon = RESOURCE_ICON[resource.type];
                  return (
                    <button
                      key={`${selectedLesson.id}-${resource.label}`}
                      type="button"
                      className="flex items-center gap-2 rounded-regular border border-border-subtle bg-background-elevated px-3 py-2 text-left text-[12.5px] text-foreground-subtitle transition-colors hover:border-border-default hover:text-foreground"
                    >
                      <ResourceIcon className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{resource.label}</span>
                      <Download className="h-3.5 w-3.5 shrink-0 text-foreground-muted" aria-hidden />
                    </button>
                  );
                })}
              </div>
            </aside>
          </div>
        </article>
      </div>

      <aside className="rounded-medium border border-border-subtle bg-background-elevated p-5 shadow-elevation-sm xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
                Aulas do curso
              </h2>
              <p className="mt-1 text-[12.5px] text-foreground-muted">
                {completedCount} de {lessons.length} concluídas
              </p>
            </div>
            <Badge variant="neutral" size="sm">
              {course.level}
            </Badge>
          </div>
          <Progress
            value={livePct}
            tone="primary"
            size="xs"
            className="mt-4"
            label={`${livePct}% do curso`}
          />
        </div>

        <ol className="flex flex-col gap-2">
          {lessons.map((lesson, index) => {
            const active = index === selectedIndex;
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-regular border p-3 text-left transition-colors",
                    active
                      ? "border-brand-primary/40 bg-brand-primary/10"
                      : "border-border-subtle bg-surface-muted/30 hover:border-border-default hover:bg-surface-elevated",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      completedIds.has(lesson.id)
                        ? "bg-background-success text-foreground-success"
                        : active
                          ? "bg-brand-primary text-white"
                          : "bg-background-subtle text-foreground-muted",
                    )}
                    aria-hidden
                  >
                    {completedIds.has(lesson.id) ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground-heading">
                      {lesson.title}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-foreground-muted">
                      <Clock className="h-3 w-3" aria-hidden />
                      {formatMinutes(lesson.durationMinutes)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>
    </section>
  );
}

function Outcome({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-success" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
