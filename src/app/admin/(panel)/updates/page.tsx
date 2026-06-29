"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { AdminPageHeader, EmptyState, Panel } from "@/components/admin/AdminPrimitives";
import { ReleaseNoteFormDialog } from "@/components/admin/ReleaseNoteFormDialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useAdminStore } from "@/lib/admin/store";
import { monthLabel } from "@/lib/admin/options";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ReleaseNote } from "@/types/admin";

type YearGroup = {
  year: number;
  months: { month: number; notes: ReleaseNote[] }[];
};

function groupByYearMonth(notes: ReleaseNote[]): YearGroup[] {
  const sorted = [...notes].sort(
    (a, b) =>
      b.year - a.year ||
      b.month - a.month ||
      b.date.localeCompare(a.date),
  );
  const years = new Map<number, Map<number, ReleaseNote[]>>();
  for (const note of sorted) {
    if (!years.has(note.year)) years.set(note.year, new Map());
    const months = years.get(note.year)!;
    if (!months.has(note.month)) months.set(note.month, []);
    months.get(note.month)!.push(note);
  }
  return [...years.entries()].map(([year, months]) => ({
    year,
    months: [...months.entries()].map(([month, monthNotes]) => ({
      month,
      notes: monthNotes,
    })),
  }));
}

export default function UpdatesPage() {
  const store = useAdminStore();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const groups = useMemo(
    () => groupByYearMonth(store.releaseNotes),
    [store.releaseNotes],
  );

  function handleDelete(note: ReleaseNote) {
    if (window.confirm(`Excluir a nota "${note.title}" (v${note.version})?`)) {
      store.deleteReleaseNote(note.id);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Backoffice", href: "/admin" }, { label: "Novidades & Updates" }]}
        title="Novidades & Updates"
        description="Gerencie as notas de atualização do sistema. Elas alimentarão a página pública de novidades, organizadas por ano e mês."
        actions={
          <>
            <Link href="/novidades" target="_blank">
              <Button variant="outline" leftIcon={<ExternalLink className="h-4 w-4" />}>
                Ver página pública
              </Button>
            </Link>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
              Nova atualização
            </Button>
          </>
        }
      />

      {store.releaseNotes.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nenhuma nota de atualização"
          description="Crie a primeira nota com versão, autor, imagem de hero e os itens do changelog."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
              Nova atualização
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.year} className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[20px] font-semibold tracking-tight text-foreground-heading">
                  {group.year}
                </h2>
                <span className="h-px flex-1 bg-border-subtle" aria-hidden />
              </div>

              {group.months.map(({ month, notes }) => (
                <div key={month} className="flex flex-col gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-muted">
                    {monthLabel(month)}
                  </p>
                  <Panel className="divide-y divide-border-subtle overflow-hidden">
                    {notes.map((note) => (
                      <NoteRow
                        key={note.id}
                        note={note}
                        onEdit={() => router.push(`/admin/updates/${note.id}`)}
                        onDelete={() => handleDelete(note)}
                      />
                    ))}
                  </Panel>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}

      <ReleaseNoteFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={(id) => router.push(`/admin/updates/${id}`)}
      />
    </div>
  );
}

function NoteRow({
  note,
  onEdit,
  onDelete,
}: {
  note: ReleaseNote;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
      <Link href={`/admin/updates/${note.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span
          aria-hidden
          className="relative flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-regular bg-background-subtle text-foreground-muted"
        >
          {note.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={note.heroImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Megaphone className="h-5 w-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              v{note.version}
            </Badge>
            <h3 className="truncate text-[14.5px] font-semibold text-foreground-heading">
              {note.title}
            </h3>
            {!note.published ? (
              <Badge variant="neutral" size="sm">
                Rascunho
              </Badge>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-foreground-muted">
            {note.authorName ? (
              <span className="inline-flex items-center gap-1.5">
                <Avatar name={note.authorName} src={note.authorAvatarUrl} size="xs" />
                {note.authorName}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {formatDate(note.date)}
            </span>
            <Badge variant="neutral" size="sm">
              {note.entries.length} {note.entries.length === 1 ? "item" : "itens"}
            </Badge>
          </div>
        </div>

        <ChevronRight className="hidden h-4 w-4 shrink-0 text-foreground-muted sm:block" aria-hidden />
      </Link>

      <div className="flex shrink-0 items-center gap-1">
        <IconButton label="Gerenciar" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </IconButton>
        <IconButton label="Excluir" variant="danger" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
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
