"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Pencil,
  Plus,
  Route,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { AdminPageHeader, EmptyState, Panel } from "@/components/admin/AdminPrimitives";
import { TrailFormDialog } from "@/components/admin/TrailFormDialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminStore } from "@/lib/admin/store";
import { cn } from "@/lib/utils";
import type { LearningTrail } from "@/types/admin";

export default function TrilhasPage() {
  const store = useAdminStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LearningTrail | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.trails
      .filter((t) =>
        statusFilter === "all"
          ? true
          : statusFilter === "published"
            ? t.published
            : !t.published,
      )
      .filter((t) =>
        q
          ? t.title.toLowerCase().includes(q) ||
            t.targetAudience.toLowerCase().includes(q)
          : true,
      );
  }, [store.trails, query, statusFilter]);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(trail: LearningTrail) {
    setEditing(trail);
    setDialogOpen(true);
  }

  function handleDelete(trail: LearningTrail) {
    if (window.confirm(`Excluir a trilha "${trail.title}"?`)) {
      store.deleteTrail(trail.id);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Backoffice", href: "/admin" }, { label: "Trilhas" }]}
        title="Trilhas de aprendizagem"
        description="Sequências de cursos com um objetivo de formação. Abra uma trilha para ordenar os cursos."
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openNew}
            disabled={store.courses.length === 0}
          >
            Nova trilha
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex h-10 flex-1 items-center rounded-regular border border-border-subtle bg-background-elevated transition-colors focus-within:border-foreground-subtitle">
          <Search aria-hidden className="ml-3 h-4 w-4 text-foreground-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título ou público-alvo..."
            aria-label="Buscar trilhas"
            className="flex-1 bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-foreground-muted outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <FilterPill active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
            Todas
          </FilterPill>
          <FilterPill
            active={statusFilter === "published"}
            onClick={() => setStatusFilter("published")}
          >
            Publicadas
          </FilterPill>
          <FilterPill active={statusFilter === "draft"} onClick={() => setStatusFilter("draft")}>
            Rascunho
          </FilterPill>
        </div>
      </div>

      {store.courses.length === 0 ? (
        <EmptyState
          icon={Route}
          title="Cadastre cursos primeiro"
          description="Trilhas são compostas por cursos. Crie cursos antes de montar uma trilha."
          action={
            <Link href="/admin/cursos">
              <Button variant="outline">Ir para cursos</Button>
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Route}
          title="Nenhuma trilha encontrada"
          description="Ajuste a busca/filtros ou crie uma nova trilha."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>
              Nova trilha
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((trail) => (
            <Panel key={trail.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/admin/trilhas/${trail.id}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-[15px] font-semibold text-foreground-heading">
                      {trail.title}
                    </h3>
                    {!trail.published ? (
                      <Badge variant="neutral" size="sm">
                        Rascunho
                      </Badge>
                    ) : null}
                    {trail.hasCertificate ? (
                      <Badge variant="primary" size="sm" icon={<Award className="h-3 w-3" />}>
                        Certificado
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-foreground-muted">
                    {trail.description || "Sem descrição."}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton label="Editar trilha" onClick={() => openEdit(trail)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Excluir trilha"
                    variant="danger"
                    onClick={() => handleDelete(trail)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-foreground-muted">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden />
                  {trail.courseIds.length} curso{trail.courseIds.length === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  {trail.targetAudience || "Geral"}
                </span>
                <span>{trail.level}</span>
                <span className="tabular-nums">{trail.points} pts</span>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <TrailFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        trail={editing}
      />
    </div>
  );
}

function FilterPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 shrink-0 items-center rounded-regular px-3.5 text-[13px] font-medium transition-colors",
        active
          ? "border border-foreground-heading bg-foreground-heading text-background-elevated"
          : "border border-border-subtle bg-background-elevated text-foreground-subtitle hover:border-border-default hover:bg-background-subtle hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function IconButton({
  children,
  label,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-regular border border-border-subtle bg-background-elevated transition-colors",
        variant === "danger"
          ? "text-foreground-muted hover:border-border-error hover:bg-background-error hover:text-foreground-error"
          : "text-foreground-muted hover:border-border-default hover:bg-background-subtle hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
