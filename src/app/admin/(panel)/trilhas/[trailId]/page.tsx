"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Award,
  BookOpen,
  Clock,
  Pencil,
  Route,
  Users,
  X,
} from "lucide-react";
import {
  AdminPageHeader,
  EmptyState,
  Panel,
  StatTile,
} from "@/components/admin/AdminPrimitives";
import { TrailFormDialog } from "@/components/admin/TrailFormDialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminStore } from "@/lib/admin/store";
import { formatMinutes } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default function TrailDetailPage({
  params,
}: {
  params: Promise<{ trailId: string }>;
}) {
  const { trailId } = use(params);
  const store = useAdminStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  const trail = store.trails.find((t) => t.id === trailId);

  if (store.ready && !trail) {
    return (
      <div className="mx-auto max-w-[900px]">
        <EmptyState
          icon={Route}
          title="Trilha não encontrada"
          description="Ela pode ter sido removida. Volte para a lista de trilhas."
          action={
            <Link href="/admin/trilhas">
              <Button variant="outline">Voltar para trilhas</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (!trail) {
    return (
      <div className="mx-auto max-w-[900px] py-10 text-foreground-muted">Carregando…</div>
    );
  }

  const courses = store.coursesForTrail(trail.id);
  const totalMinutes = courses.reduce((s, c) => s + c.estimatedMinutes, 0);

  function move(index: number, direction: -1 | 1) {
    if (!trail) return;
    const target = index + direction;
    if (target < 0 || target >= trail.courseIds.length) return;
    const next = [...trail.courseIds];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved!);
    store.upsertTrail({ ...trail, courseIds: next, updatedAt: new Date().toISOString() });
  }

  function removeCourse(courseId: string) {
    if (!trail) return;
    store.upsertTrail({
      ...trail,
      courseIds: trail.courseIds.filter((id) => id !== courseId),
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[
          { label: "Backoffice", href: "/admin" },
          { label: "Trilhas", href: "/admin/trilhas" },
          { label: trail.title },
        ]}
        title={trail.title}
        description={trail.description || "Sem descrição."}
        actions={
          <Button
            variant="outline"
            leftIcon={<Pencil className="h-4 w-4" />}
            onClick={() => setDialogOpen(true)}
          >
            Editar trilha
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {!trail.published ? <Badge variant="neutral">Rascunho</Badge> : <Badge variant="success" dot>Publicada</Badge>}
        <Badge variant="info">{trail.level}</Badge>
        {trail.hasCertificate ? (
          <Badge variant="primary" icon={<Award className="h-3 w-3" />}>
            Certificado final
          </Badge>
        ) : null}
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={BookOpen} label="Cursos" value={courses.length} />
        <StatTile icon={Clock} label="Carga horária" value={formatMinutes(totalMinutes)} />
        <StatTile icon={Users} label="Público-alvo" value={trail.targetAudience || "Geral"} />
        <StatTile icon={Award} label="Pontuação" value={`${trail.points} pts`} />
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-[17px] font-semibold tracking-tight text-foreground-heading">
            Cursos da trilha
          </h2>
          <p className="mt-0.5 text-[13px] text-foreground-muted">
            A ordem abaixo é a sequência que o aluno percorre. Use as setas para reordenar.
          </p>
        </div>

        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Nenhum curso na trilha"
            description="Edite a trilha para vincular cursos."
            action={
              <Button variant="outline" onClick={() => setDialogOpen(true)}>
                Editar trilha
              </Button>
            }
          />
        ) : (
          <Panel className="divide-y divide-border-subtle overflow-hidden">
            {courses.map((course, index) => (
              <div key={course.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background-subtle text-[12px] font-semibold text-foreground-subtitle"
                >
                  {index + 1}
                </span>
                <Link
                  href={`/admin/cursos/${course.id}`}
                  className="min-w-0 flex-1"
                >
                  <h3 className="truncate text-[14px] font-semibold text-foreground-heading">
                    {course.title}
                  </h3>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12px] text-foreground-muted">
                    <span className="font-medium uppercase tracking-[0.08em]">
                      {course.categoryName}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {formatMinutes(course.estimatedMinutes)}
                    </span>
                    {!course.published ? (
                      <Badge variant="neutral" size="sm">
                        Rascunho
                      </Badge>
                    ) : null}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton
                    label="Mover para cima"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Mover para baixo"
                    disabled={index === courses.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Remover da trilha"
                    variant="danger"
                    onClick={() => removeCourse(course.id)}
                  >
                    <X className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            ))}
          </Panel>
        )}
      </section>

      <TrailFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} trail={trail} />
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
