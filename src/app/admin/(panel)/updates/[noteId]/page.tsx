"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronRight,
  Eye,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { EmptyState, Panel } from "@/components/admin/AdminPrimitives";
import { ReleaseNoteFormDialog } from "@/components/admin/ReleaseNoteFormDialog";
import { ReleaseEntryDialog } from "@/components/admin/ReleaseEntryDialog";
import { ENTRY_BADGE_VARIANT } from "@/components/admin/release-entry-style";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useAdminStore } from "@/lib/admin/store";
import { monthLabel } from "@/lib/admin/options";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  RELEASE_ENTRY_TYPE_LABEL,
  type ReleaseEntry,
  type ReleaseNote,
} from "@/types/admin";

export default function UpdateDetailPage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = use(params);
  const store = useAdminStore();

  const [noteDialog, setNoteDialog] = useState(false);
  const [entryDialog, setEntryDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ReleaseEntry | null>(null);

  const note = store.releaseNotes.find((n) => n.id === noteId);

  if (store.ready && !note) {
    return (
      <div className="mx-auto max-w-[900px]">
        <EmptyState
          icon={Megaphone}
          title="Nota não encontrada"
          description="Ela pode ter sido removida. Volte para a lista de novidades."
          action={
            <Link href="/admin/updates">
              <Button variant="outline">Voltar para updates</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (!note) {
    return <div className="mx-auto max-w-[900px] py-10 text-foreground-muted">Carregando…</div>;
  }

  const entries = [...note.entries].sort((a, b) => a.order - b.order);

  function openNewEntry() {
    setEditingEntry(null);
    setEntryDialog(true);
  }

  function openEditEntry(entry: ReleaseEntry) {
    setEditingEntry(entry);
    setEntryDialog(true);
  }

  function deleteEntry(entry: ReleaseEntry) {
    if (!note) return;
    if (!window.confirm("Excluir este item da atualização?")) return;
    store.upsertReleaseNote({
      ...note,
      entries: note.entries.filter((e) => e.id !== entry.id),
    });
  }

  function move(entry: ReleaseEntry, direction: -1 | 1) {
    if (!note) return;
    const index = entries.findIndex((e) => e.id === entry.id);
    const target = entries[index + direction];
    if (!target) return;
    const swapped = note.entries.map((e) => {
      if (e.id === entry.id) return { ...e, order: target.order };
      if (e.id === target.id) return { ...e, order: entry.order };
      return e;
    });
    store.upsertReleaseNote({ ...note, entries: swapped });
  }

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-[12px] text-foreground-muted"
        >
          <Link href="/admin" className="transition-colors hover:text-foreground">
            Backoffice
          </Link>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <Link href="/admin/updates" className="transition-colors hover:text-foreground">
            Novidades & Updates
          </Link>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <span className="truncate text-foreground-subtitle">{note.title}</span>
        </nav>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="primary">v{note.version}</Badge>
              <h1 className="text-[24px] font-semibold tracking-tight text-foreground-heading sm:text-[28px]">
                {note.title}
              </h1>
              {!note.published ? <Badge variant="neutral">Rascunho</Badge> : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-foreground-muted">
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
              <span>
                {monthLabel(note.month)} de {note.year}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<Pencil className="h-4 w-4" />}
              onClick={() => setNoteDialog(true)}
            >
              Editar nota
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNewEntry}>
              Novo item
            </Button>
          </div>
        </div>
      </div>

      {/* Gestão dos itens */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[16px] font-semibold tracking-tight text-foreground-heading">
          Itens do changelog
        </h2>

        {entries.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Nenhum item ainda"
            description="Adicione os itens (melhorias, correções, novidades) que compõem esta atualização."
            action={
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNewEntry}>
                Novo item
              </Button>
            }
          />
        ) : (
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="border-b border-border-subtle bg-background-subtle text-[11px] uppercase tracking-[0.08em] text-foreground-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Tipo</th>
                  <th className="px-4 py-2.5 font-medium">Caso</th>
                  <th className="px-4 py-2.5 font-medium">Produto</th>
                  <th className="px-4 py-2.5 font-medium">Descrição</th>
                  <th className="px-4 py-2.5 text-center font-medium">Visualizar</th>
                  <th className="px-4 py-2.5 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {entries.map((entry, index) => (
                  <tr key={entry.id} className="align-top">
                    <td className="px-4 py-3">
                      <Badge variant={ENTRY_BADGE_VARIANT[entry.type]} size="sm">
                        {RELEASE_ENTRY_TYPE_LABEL[entry.type]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground-subtitle">
                      {entry.caso || "-"}
                    </td>
                    <td className="px-4 py-3 text-foreground-subtitle">
                      {entry.produto || "-"}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      <p className="max-w-[420px] leading-relaxed">{entry.description}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Eye
                        className={cn(
                          "mx-auto h-4 w-4",
                          entry.viewUrl ? "text-brand-primary" : "text-icon-disabled",
                        )}
                        aria-label={entry.viewUrl ? "Link configurado" : "Sem link"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          label="Subir"
                          disabled={index === 0}
                          onClick={() => move(entry, -1)}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </IconButton>
                        <IconButton
                          label="Descer"
                          disabled={index === entries.length - 1}
                          onClick={() => move(entry, 1)}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </IconButton>
                        <IconButton label="Editar" onClick={() => openEditEntry(entry)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </IconButton>
                        <IconButton
                          label="Excluir"
                          variant="danger"
                          onClick={() => deleteEntry(entry)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </section>

      {/* Prévia da página pública */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground-heading">
            Prévia da página pública
          </h2>
          <Badge variant="neutral" size="sm">
            Referência para a landing page
          </Badge>
        </div>
        <ReleaseNotePreview note={note} entries={entries} />
      </section>

      <ReleaseNoteFormDialog
        open={noteDialog}
        onClose={() => setNoteDialog(false)}
        note={note}
      />
      <ReleaseEntryDialog
        open={entryDialog}
        onClose={() => setEntryDialog(false)}
        note={note}
        entry={editingEntry}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Prévia fiel ao layout final (referência para a tela pública)               */
/* -------------------------------------------------------------------------- */

function ReleaseNotePreview({
  note,
  entries,
}: {
  note: ReleaseNote;
  entries: ReleaseEntry[];
}) {
  return (
    <Panel className="overflow-hidden">
      {/* Faixa de título */}
      <div className="bg-brand-tertiary px-6 py-4 text-center">
        <h3 className="text-[18px] font-semibold tracking-tight text-white">
          {note.title}
        </h3>
      </div>

      <div className="p-6">
        {/* Versão + autor */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Badge variant="primary">v{note.version}</Badge>
            <span className="text-[15px] font-semibold text-foreground-heading">
              Versão {note.version} · {monthLabel(note.month)} de {note.year}
            </span>
          </div>
          {note.authorName ? (
            <div className="flex items-center gap-2 text-[13px] text-foreground-muted">
              <Avatar name={note.authorName} src={note.authorAvatarUrl} size="sm" />
              <div className="leading-tight">
                <p className="font-medium text-foreground-subtitle">{note.authorName}</p>
                <p className="text-[12px]">{formatDate(note.date)}</p>
              </div>
            </div>
          ) : null}
        </div>

        {note.summary ? (
          <p className="mt-4 text-[14px] leading-relaxed text-foreground-subtitle">
            {note.summary}
          </p>
        ) : null}

        {/* Hero */}
        <div className="mt-5 overflow-hidden rounded-medium border border-border-subtle">
          {note.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={note.heroImageUrl}
              alt=""
              className="h-auto w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/6] items-center justify-center bg-gradient-to-br from-brand-primary/12 via-brand-primary/4 to-transparent text-foreground-muted">
              <span className="text-[13px]">Imagem de hero (opcional)</span>
            </div>
          )}
        </div>

        {/* Tabela */}
        {entries.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="text-[13px] font-semibold text-brand-tertiary">
                  <th className="px-3 pb-3 text-center">Tipo</th>
                  <th className="px-3 pb-3 text-center">Caso</th>
                  <th className="px-3 pb-3 text-center">Produto</th>
                  <th className="px-3 pb-3">Descrição</th>
                  <th className="px-3 pb-3 text-center">Visualizar</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-border-subtle align-top">
                    <td className="px-3 py-4 text-center">
                      <Badge variant={ENTRY_BADGE_VARIANT[entry.type]} size="sm">
                        {RELEASE_ENTRY_TYPE_LABEL[entry.type]}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-center font-medium text-foreground-subtitle">
                      {entry.caso || "-"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-center text-foreground-subtitle">
                      {entry.produto || "-"}
                    </td>
                    <td className="px-3 py-4 text-foreground-muted">
                      <p className="leading-relaxed">{entry.description}</p>
                    </td>
                    <td className="px-3 py-4 text-center">
                      {entry.viewUrl ? (
                        <a
                          href={entry.viewUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Visualizar atualização"
                          className="inline-flex text-brand-primary transition-opacity hover:opacity-70"
                        >
                          <Eye className="h-5 w-5" />
                        </a>
                      ) : (
                        <Eye className="mx-auto h-5 w-5 text-icon-disabled" aria-hidden />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </Panel>
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
        "inline-flex h-8 w-8 items-center justify-center rounded-regular border border-border-subtle bg-background-elevated transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "danger"
          ? "text-foreground-muted hover:border-border-error hover:bg-background-error hover:text-foreground-error"
          : "text-foreground-muted hover:border-border-default hover:bg-background-subtle hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
