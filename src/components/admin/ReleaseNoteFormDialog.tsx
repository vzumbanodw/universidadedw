"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { MediaField } from "@/components/admin/MediaField";
import { useAdminStore } from "@/lib/admin/store";
import {
  MONTH_OPTIONS,
  createId,
  yearOptions,
} from "@/lib/admin/options";
import type { ReleaseNote } from "@/types/admin";

type ReleaseNoteFormDialogProps = {
  open: boolean;
  onClose: () => void;
  note?: ReleaseNote | null;
  onCreated?: (id: string) => void;
};

type FormState = {
  version: string;
  title: string;
  year: number;
  month: number;
  date: string;
  authorName: string;
  authorAvatarUrl?: string;
  heroImageUrl?: string;
  summary: string;
  published: boolean;
};

function emptyForm(): FormState {
  const now = new Date();
  return {
    version: "",
    title: "",
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    date: now.toISOString().slice(0, 10),
    authorName: "",
    authorAvatarUrl: undefined,
    heroImageUrl: undefined,
    summary: "",
    published: true,
  };
}

export function ReleaseNoteFormDialog({
  open,
  onClose,
  note,
  onCreated,
}: ReleaseNoteFormDialogProps) {
  const store = useAdminStore();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      note
        ? {
            version: note.version,
            title: note.title,
            year: note.year,
            month: note.month,
            date: note.date,
            authorName: note.authorName,
            authorAvatarUrl: note.authorAvatarUrl,
            heroImageUrl: note.heroImageUrl,
            summary: note.summary ?? "",
            published: note.published,
          }
        : emptyForm(),
    );
  }, [open, note]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.version.trim()) {
      setError("Informe a versão (aparece na badge à frente do título).");
      return;
    }
    if (!form.title.trim()) {
      setError("Informe o título da nota de atualização.");
      return;
    }

    const id = note?.id ?? createId("rn");
    const next: ReleaseNote = {
      id,
      version: form.version.trim(),
      title: form.title.trim(),
      year: Number(form.year),
      month: Number(form.month),
      date: form.date,
      authorName: form.authorName.trim(),
      authorAvatarUrl: form.authorAvatarUrl,
      heroImageUrl: form.heroImageUrl,
      summary: form.summary.trim() || undefined,
      entries: note?.entries ?? [],
      published: form.published,
    };

    store.upsertReleaseNote(next);
    if (!note) onCreated?.(id);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={note ? "Editar nota de atualização" : "Nova nota de atualização"}
      description="A versão aparece numa badge à frente do título. A nota é organizada por ano e mês."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {note ? "Salvar alterações" : "Criar nota"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p role="alert" className="rounded-regular border border-border-error bg-background-error px-3.5 py-2.5 text-sm text-foreground-error">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <Input
            label="Versão"
            required
            placeholder="01"
            value={form.version}
            onChange={(e) => update("version", e.target.value)}
          />
          <Input
            label="Título"
            required
            placeholder="Demais melhorias e correções de bugs"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Ano"
            value={String(form.year)}
            onChange={(e) => update("year", Number(e.target.value))}
            options={yearOptions()}
          />
          <Select
            label="Mês"
            value={String(form.month)}
            onChange={(e) => update("month", Number(e.target.value))}
            options={MONTH_OPTIONS}
          />
          <Input
            label="Data de publicação"
            type="date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
          />
        </div>

        <div className="rounded-medium border border-border-subtle bg-background-subtle/40 p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-muted">
            Autoria
          </p>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Input
              label="Autor (quem está subindo)"
              placeholder="Nome do responsável"
              value={form.authorName}
              onChange={(e) => update("authorName", e.target.value)}
            />
            <MediaField
              label="Avatar do autor"
              kind="image"
              variant="avatar"
              hint="Exibido ao lado do nome."
              value={form.authorAvatarUrl}
              onChange={(value) => update("authorAvatarUrl", value)}
            />
          </div>
        </div>

        <MediaField
          label="Imagem de hero"
          kind="image"
          hint="Imagem padrão exibida no topo da nota (16:9 recomendado)."
          value={form.heroImageUrl}
          onChange={(value) => update("heroImageUrl", value)}
        />

        <Textarea
          label="Resumo (opcional)"
          rows={2}
          placeholder="Uma linha de introdução exibida antes da tabela de itens."
          value={form.summary}
          onChange={(e) => update("summary", e.target.value)}
        />

        <label className="flex items-center gap-2.5 text-sm text-foreground-subtitle">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => update("published", e.target.checked)}
            className="h-4 w-4 rounded-[4px] border border-border-default bg-background-elevated checked:border-brand-secondary checked:bg-brand-secondary"
          />
          Publicada (visível na landing page)
        </label>
      </div>
    </Modal>
  );
}
