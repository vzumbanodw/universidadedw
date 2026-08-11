"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  ListChecks,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { AdminPageHeader, EmptyState, Panel } from "@/components/admin/AdminPrimitives";
import { CourseFormDialog } from "@/components/admin/CourseFormDialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { useAdminStore } from "@/lib/admin/store";
import { formatMinutes } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { AdminCourse } from "@/types/admin";

type SortBy = "recent" | "oldest" | "alpha";
type StatusFilter = "all" | "published" | "draft";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "recent", label: "Mais recentes" },
  { value: "oldest", label: "Mais antigos" },
  { value: "alpha", label: "Ordem alfabética (A–Z)" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos os status" },
  { value: "published", label: "Publicados" },
  { value: "draft", label: "Rascunhos" },
];

export default function CursosPage() {
  const store = useAdminStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCourse | null>(null);
  const [query, setQuery] = useState("");
  // Padrão "Mais recentes": os últimos cursos cadastrados aparecem no topo.
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // A ordem do array é a ordem de CADASTRO (cursos novos entram no fim) —
    // o índice original serve de linha do tempo para recentes/antigos.
    const rows = store.courses
      .map((course, index) => ({ course, index }))
      .filter(({ course }) => {
        if (q && !course.title.toLowerCase().includes(q) && !course.categoryName.toLowerCase().includes(q)) {
          return false;
        }
        if (categoryFilter !== "all" && course.categoryId !== categoryFilter) return false;
        if (statusFilter === "published" && !course.published) return false;
        if (statusFilter === "draft" && course.published) return false;
        return true;
      });

    rows.sort((a, b) => {
      if (sortBy === "alpha") {
        return a.course.title.localeCompare(b.course.title, "pt-BR", { sensitivity: "base" });
      }
      return sortBy === "recent" ? b.index - a.index : a.index - b.index;
    });

    return rows.map(({ course }) => course);
  }, [store.courses, query, sortBy, categoryFilter, statusFilter]);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(course: AdminCourse) {
    setEditing(course);
    setDialogOpen(true);
  }

  function handleDelete(course: AdminCourse) {
    const lessons = store.lessonsForCourse(course.id).length;
    const message =
      lessons > 0
        ? `Excluir "${course.title}" e suas ${lessons} aula(s)?`
        : `Excluir "${course.title}"?`;
    if (window.confirm(message)) {
      store.deleteCourse(course.id);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Backoffice", href: "/admin" }, { label: "Cursos & Aulas" }]}
        title="Cursos & Aulas"
        description="Gerencie os cursos da plataforma. Abra um curso para administrar suas aulas, vídeos e materiais."
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openNew}
            disabled={store.categories.length === 0}
          >
            Novo curso
          </Button>
        }
      />

      {/* Busca + filtros */}
      <div className="flex flex-col gap-3">
        <div className="relative flex h-10 items-center rounded-regular border border-border-subtle bg-background-elevated transition-colors focus-within:border-foreground-subtitle">
          <Search aria-hidden className="ml-3 h-4 w-4 text-foreground-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cursos por título ou aplicação..."
            aria-label="Buscar cursos"
            className="flex-1 bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-foreground-muted outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label="Ordenar por"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            options={SORT_OPTIONS}
          />
          <Select
            label="Aplicação"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: "all", label: "Todas as aplicações" },
              ...store.categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      {store.categories.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Crie uma categoria primeiro"
          description="Cursos precisam pertencer a uma aplicação. Cadastre uma aplicação antes."
          action={
            <Link href="/admin/categorias">
              <Button variant="outline">Ir para categorias</Button>
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhum curso encontrado"
          description="Ajuste a busca/filtros ou crie um novo curso."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>
              Novo curso
            </Button>
          }
        />
      ) : (
        <Panel className="divide-y divide-border-subtle overflow-hidden">
          {filtered.map((course) => {
            const lessons = store.lessonsForCourse(course.id).length;
            return (
              <div key={course.id} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
                <Link
                  href={`/admin/cursos/${course.id}`}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  <span
                    aria-hidden
                    className="relative flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-regular bg-background-subtle text-foreground-muted"
                  >
                    {course.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.coverImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[14.5px] font-semibold text-foreground-heading">
                        {course.title}
                      </h3>
                      {!course.published ? (
                        <Badge variant="neutral" size="sm">
                          Rascunho
                        </Badge>
                      ) : null}
                      {course.certificate ? (
                        <Badge variant="primary" size="sm">
                          Certificado
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-foreground-muted">
                      <span className="font-medium uppercase tracking-[0.08em]">
                        {course.categoryName}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ListChecks className="h-3.5 w-3.5" aria-hidden />
                        {lessons} aula{lessons === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {formatMinutes(course.estimatedMinutes)}
                      </span>
                      <span>{course.level}</span>
                    </p>
                  </div>
                </Link>

                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/admin/cursos/${course.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-regular border border-border-subtle bg-background-elevated px-3 text-[13px] font-medium text-foreground-subtitle transition-colors hover:border-border-default hover:bg-background-subtle hover:text-foreground"
                  >
                    <ListChecks className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">Aulas</span>
                  </Link>
                  <IconButton label="Editar curso" onClick={() => openEdit(course)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Excluir curso"
                    variant="danger"
                    onClick={() => handleDelete(course)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            );
          })}
        </Panel>
      )}

      <CourseFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        course={editing}
      />
    </div>
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
