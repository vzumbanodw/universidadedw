"use client";

import { useState } from "react";
import {
  BarChart3,
  Beaker,
  Building2,
  ClipboardList,
  CreditCard,
  Factory,
  FileText,
  Headphones,
  Layers,
  Pencil,
  Plus,
  Trash2,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { AdminPageHeader, EmptyState, Panel } from "@/components/admin/AdminPrimitives";
import { CategoryFormDialog } from "@/components/admin/CategoryFormDialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminStore } from "@/lib/admin/store";
import { cn } from "@/lib/utils";
import type { AdminCategory, TrackCategoryIcon } from "@/types/admin";

const ICONS: Record<TrackCategoryIcon, LucideIcon> = {
  chart: BarChart3,
  users: Users,
  flask: Beaker,
  clipboard: ClipboardList,
  "file-text": FileText,
  wallet: Wallet,
  building: Building2,
  headset: Headphones,
  "credit-card": CreditCard,
  factory: Factory,
};

const ACCENT_DOT: Record<string, string> = {
  teal: "bg-brand-primary",
  navy: "bg-brand-secondary",
  tertiary: "bg-brand-tertiary",
  orange: "bg-brand-orange",
  green: "bg-brand-green",
  red: "bg-foreground-error",
  violet: "bg-[#6C90FF]",
  info: "bg-foreground-information",
  neutral: "bg-foreground-muted",
};

export default function CategoriasPage() {
  const store = useAdminStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);

  const applications = store.categories;

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(category: AdminCategory) {
    setEditing(category);
    setDialogOpen(true);
  }

  function handleDelete(category: AdminCategory) {
    const linked = store.courses.filter((c) => c.categoryId === category.id).length;
    const message =
      linked > 0
        ? `"${category.name}" tem ${linked} curso(s) vinculado(s). Excluir mesmo assim? Os cursos não serão removidos, mas ficarão sem categoria.`
        : `Excluir "${category.name}"?`;
    if (window.confirm(message)) {
      store.deleteCategory(category.id);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-8">
      <AdminPageHeader
        breadcrumb={[{ label: "Backoffice", href: "/admin" }, { label: "Aplicações" }]}
        title="Aplicações"
        description="Aplicações que organizam os cursos e as aulas por produto. Definem ícone, cor e textos exibidos ao aluno."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>
            Nova categoria
          </Button>
        }
      />

      {store.categories.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Nenhuma categoria ainda"
          description="Crie sua primeira aplicação para começar a estruturar o conteúdo."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>
              Nova categoria
            </Button>
          }
        />
      ) : (
        <CategoryGroup
          title="Aplicações"
          description="Produtos da plataforma que organizam os cursos e as aulas."
          categories={applications}
          store={store}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        category={editing}
      />
    </div>
  );
}

function CategoryGroup({
  title,
  description,
  categories,
  store,
  onEdit,
  onDelete,
}: {
  title: string;
  description: string;
  categories: AdminCategory[];
  store: ReturnType<typeof useAdminStore>;
  onEdit: (category: AdminCategory) => void;
  onDelete: (category: AdminCategory) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-[17px] font-semibold tracking-tight text-foreground-heading">
          {title}
        </h2>
        <p className="mt-0.5 text-[13px] text-foreground-muted">{description}</p>
      </div>

      <Panel className="divide-y divide-border-subtle overflow-hidden">
        {categories.map((category) => {
          const Icon = ICONS[category.iconKey];
          const courseCount = store.courses.filter(
            (c) => c.categoryId === category.id,
          ).length;
          return (
            <div
              key={category.id}
              className="flex items-center gap-4 px-4 py-3.5 sm:px-5"
            >
              <span
                aria-hidden
                className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-regular bg-background-subtle text-foreground-subtitle"
              >
                {category.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.coverImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      ACCENT_DOT[category.accent],
                    )}
                  />
                  <h3 className="truncate text-[14.5px] font-semibold text-foreground-heading">
                    {category.name}
                  </h3>
                  {!category.published ? (
                    <Badge variant="neutral" size="sm">
                      Rascunho
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-foreground-muted">
                  {category.tagline}
                </p>
              </div>

              <div className="hidden shrink-0 items-center gap-1.5 text-[12px] text-foreground-muted sm:flex">
                <Badge variant="neutral" size="sm">
                  {courseCount} curso{courseCount === 1 ? "" : "s"}
                </Badge>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <IconButton label="Editar" onClick={() => onEdit(category)}>
                  <Pencil className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label="Excluir"
                  variant="danger"
                  onClick={() => onDelete(category)}
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          );
        })}
      </Panel>
    </section>
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
