"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/lib/admin/store";
import { RELEASE_ENTRY_TYPE_OPTIONS, createId } from "@/lib/admin/options";
import type {
  ReleaseEntry,
  ReleaseEntryType,
  ReleaseNote,
} from "@/types/admin";

type ReleaseEntryDialogProps = {
  open: boolean;
  onClose: () => void;
  note: ReleaseNote;
  entry?: ReleaseEntry | null;
};

type FormState = {
  type: ReleaseEntryType;
  caso: string;
  produto: string;
  description: string;
  viewUrl: string;
};

const EMPTY: FormState = {
  type: "melhoria",
  caso: "",
  produto: "",
  description: "",
  viewUrl: "",
};

export function ReleaseEntryDialog({
  open,
  onClose,
  note,
  entry,
}: ReleaseEntryDialogProps) {
  const store = useAdminStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      entry
        ? {
            type: entry.type,
            caso: entry.caso,
            produto: entry.produto,
            description: entry.description,
            viewUrl: entry.viewUrl ?? "",
          }
        : EMPTY,
    );
  }, [open, entry]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.description.trim()) {
      setError("Informe a descrição da atualização.");
      return;
    }

    const nextEntry: ReleaseEntry = {
      id: entry?.id ?? createId("re"),
      order: entry?.order ?? (note.entries.at(-1)?.order ?? 0) + 1,
      type: form.type,
      caso: form.caso.trim(),
      produto: form.produto.trim(),
      description: form.description.trim(),
      viewUrl: form.viewUrl.trim() || undefined,
    };

    const entries = entry
      ? note.entries.map((e) => (e.id === entry.id ? nextEntry : e))
      : [...note.entries, nextEntry];

    store.upsertReleaseNote({ ...note, entries });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={entry ? "Editar item" : "Novo item da atualização"}
      description="Cada item é uma linha do changelog, com Tipo, Caso, Produto, Descrição e link de visualização."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {entry ? "Salvar item" : "Adicionar item"}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Tipo"
            value={form.type}
            onChange={(e) => update("type", e.target.value as ReleaseEntryType)}
            options={RELEASE_ENTRY_TYPE_OPTIONS}
          />
          <Input
            label="Caso"
            placeholder="WEB-841"
            value={form.caso}
            onChange={(e) => update("caso", e.target.value)}
          />
        </div>

        <Input
          label="Produto"
          placeholder="CRM (Novo) · Optfácil (Delphi)…"
          value={form.produto}
          onChange={(e) => update("produto", e.target.value)}
        />

        <Textarea
          label="Descrição"
          required
          rows={4}
          placeholder="Descreva a melhoria, correção ou novidade."
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />

        <Input
          label="Link de visualização (opcional)"
          placeholder="https://… ou rota interna do sistema"
          hint="Quando preenchido, o ícone de olho fica ativo na tabela."
          value={form.viewUrl}
          onChange={(e) => update("viewUrl", e.target.value)}
        />
      </div>
    </Modal>
  );
}
