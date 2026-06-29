"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Award,
  BookOpen,
  Clock,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { AdminPageHeader, EmptyState, Panel, StatTile } from "@/components/admin/AdminPrimitives";
import { CourseFormDialog } from "@/components/admin/CourseFormDialog";
import { LessonFormDialog } from "@/components/admin/LessonFormDialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminStore } from "@/lib/admin/store";
import { formatMinutes } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { AdminLesson } from "@/types/admin";

export default function CourseDetailAdminPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const store = useAdminStore();

  const [courseDialog, setCourseDialog] = useState(false);
  const [lessonDialog, setLessonDialog] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLesson | null>(null);

  const course = store.courses.find((c) => c.id === courseId);
  const lessons = store.lessonsForCourse(courseId);

  if (store.ready && !course) {
    return (
      <div className="mx-auto max-w-[900px]">
        <EmptyState
          icon={BookOpen}
          title="Curso não encontrado"
          description="Ele pode ter sido removido. Volte para a lista de cursos."
          action={
            <Link href="/admin/cursos">
              <Button variant="outline">Voltar para cursos</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (!course) {
    return <div className="mx-auto max-w-[900px] py-10 text-foreground-muted">Carregando…</div>;
  }

  const totalMinutes = lessons.reduce((sum, l) => sum + l.durationMinutes, 0);

  function openNewLesson() {
    setEditingLesson(null);
    setLessonDialog(true);
  }

  function openEditLesson(lesson: AdminLesson) {
    setEditingLesson(lesson);
    setLessonDialog(true);
  }

  function handleDeleteLesson(lesson: AdminLesson) {
    if (!window.confirm(`Excluir a aula "${lesson.title}"?`)) return;
    store.deleteLesson(lesson.id);
    if (course) {
      store.upsertCourse({
        ...course,
        lessonsCount: Math.max(0, store.lessonsForCourse(course.id).length - 1),
      });
    }
  }

  function move(lesson: AdminLesson, direction: -1 | 1) {
    const index = lessons.findIndex((l) => l.id === lesson.id);
    const target = lessons[index + direction];
    if (!target) return;
    store.upsertLesson({ ...lesson, order: target.order });
    store.upsertLesson({ ...target, order: lesson.order });
  }

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[
          { label: "Backoffice", href: "/admin" },
          { label: "Cursos", href: "/admin/cursos" },
          { label: course.title },
        ]}
        title={course.title}
        description={course.description || "Sem descrição."}
        actions={
          <Button
            variant="outline"
            leftIcon={<Pencil className="h-4 w-4" />}
            onClick={() => setCourseDialog(true)}
          >
            Editar curso
          </Button>
        }
      />

      {/* Resumo do curso */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <Panel className="overflow-hidden">
          <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-brand-primary/16 via-brand-primary/5 to-transparent">
            <div aria-hidden className="absolute inset-0 bg-grid-pattern-subtle opacity-50" />
            {course.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.coverImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <BookOpen className="relative h-8 w-8 text-brand-primary" aria-hidden />
            )}
          </div>
          <div className="flex flex-col gap-2.5 p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="primary" size="sm">
                {course.categoryName}
              </Badge>
              <Badge variant="info" size="sm">
                {course.level}
              </Badge>
              {course.certificate ? (
                <Badge variant="success" size="sm" dot>
                  Certificado
                </Badge>
              ) : null}
              {!course.published ? (
                <Badge variant="neutral" size="sm">
                  Rascunho
                </Badge>
              ) : null}
            </div>
            <dl className="mt-1 grid grid-cols-2 gap-2 text-[12.5px]">
              <Meta label="Formato" value={course.format} />
              <Meta label="Duração estimada" value={formatMinutes(course.estimatedMinutes)} />
            </dl>
            {course.promoVideoUrl ? (
              <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-foreground-muted">
                <Video className="h-3.5 w-3.5 text-brand-primary" aria-hidden />
                Vídeo de apresentação configurado
              </p>
            ) : null}
          </div>
        </Panel>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile icon={ListChecks} label="Aulas" value={lessons.length} />
          <StatTile icon={Clock} label="Minutos de aula" value={totalMinutes} />
          <StatTile
            icon={Award}
            label="Com vídeo"
            value={lessons.filter((l) => l.videoUrl).length}
          />
        </div>
      </div>

      {/* Aulas */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-foreground-heading">
              Aulas do curso
            </h2>
            <p className="mt-0.5 text-[13px] text-foreground-muted">
              Ordene, edite e publique as aulas que compõem o curso.
            </p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNewLesson}>
            Nova aula
          </Button>
        </div>

        {lessons.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Nenhuma aula ainda"
            description="Adicione a primeira aula com vídeo, conteúdo e materiais."
            action={
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNewLesson}>
                Nova aula
              </Button>
            }
          />
        ) : (
          <Panel className="divide-y divide-border-subtle overflow-hidden">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background-subtle text-[12px] font-semibold text-foreground-subtitle"
                >
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[14px] font-semibold text-foreground-heading">
                      {lesson.title}
                    </h3>
                    {lesson.videoUrl ? (
                      <Video className="h-3.5 w-3.5 shrink-0 text-brand-primary" aria-hidden />
                    ) : null}
                    {!lesson.published ? (
                      <Badge variant="neutral" size="sm">
                        Rascunho
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12px] text-foreground-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {formatMinutes(lesson.durationMinutes)}
                    </span>
                    <span>
                      {lesson.resources.length} material
                      {lesson.resources.length === 1 ? "" : "is"}
                    </span>
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <IconButton
                    label="Mover para cima"
                    disabled={index === 0}
                    onClick={() => move(lesson, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Mover para baixo"
                    disabled={index === lessons.length - 1}
                    onClick={() => move(lesson, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Editar aula" onClick={() => openEditLesson(lesson)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Excluir aula"
                    variant="danger"
                    onClick={() => handleDeleteLesson(lesson)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            ))}
          </Panel>
        )}
      </section>

      <CourseFormDialog
        open={courseDialog}
        onClose={() => setCourseDialog(false)}
        course={course}
      />
      <LessonFormDialog
        open={lessonDialog}
        onClose={() => setLessonDialog(false)}
        courseId={course.id}
        lesson={editingLesson}
        nextOrder={(lessons.at(-1)?.order ?? 0) + 1}
      />
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-regular border border-border-subtle bg-surface-muted/40 px-3 py-2">
      <dt className="text-[10px] font-medium uppercase tracking-[0.1em] text-foreground-muted">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[13px] font-semibold text-foreground-heading">
        {value}
      </dd>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  variant = "default",
  disabled = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-regular border border-border-subtle bg-background-elevated transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "danger"
          ? "text-foreground-muted hover:border-border-error hover:bg-background-error hover:text-foreground-error"
          : "text-foreground-muted hover:border-border-default hover:bg-background-subtle hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
