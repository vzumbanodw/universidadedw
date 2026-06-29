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
  ACCENT_OPTIONS,
  CATEGORY_TYPE_OPTIONS,
  ICON_OPTIONS,
  createId,
  slugify,
} from "@/lib/admin/options";
import type {
  AdminCategory,
  TrackCategoryAccent,
  TrackCategoryIcon,
  TrackCategoryType,
} from "@/types/admin";

type CategoryFormDialogProps = {
  open: boolean;
  onClose: () => void;
  category?: AdminCategory | null;
};

type FormState = {
  name: string;
  type: TrackCategoryType;
  tagline: string;
  description: string;
  iconKey: TrackCategoryIcon;
  accent: TrackCategoryAccent;
  coverImageUrl?: string;
  published: boolean;
};

const EMPTY: FormState = {
  name: "",
  type: "aplicacao",
  tagline: "",
  description: "",
  iconKey: "chart",
  accent: "teal",
  coverImageUrl: undefined,
  published: true,
};

export function CategoryFormDialog({ open, onClose, category }: CategoryFormDialogProps) {
  const store = useAdminStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      category
        ? {
            name: category.name,
            type: category.type,
            tagline: category.tagline,
            description: category.description,
            iconKey: category.iconKey,
            accent: category.accent,
            coverImageUrl: category.coverImageUrl,
            published: category.published,
          }
        : EMPTY,
    );
  }, [open, category]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) {
      setError("Informe o nome da aplicação ou módulo.");
      return;
    }
    if (!form.tagline.trim()) {
      setError("Informe um resumo curto (tagline).");
      return;
    }

    const slug = slugify(form.name);
    const base: AdminCategory = category
      ? { ...category }
      : {
          id: createId(form.type === "aplicacao" ? "app" : "mod"),
          type: form.type,
          name: form.name,
          tagline: form.tagline,
          iconKey: form.iconKey,
          accent: form.accent,
          trackCount: 0,
          lessonCount: 0,
          inProgress: 0,
          completed: 0,
          progressPct: 0,
          href: `/dashboard/trilhas?categoria=${slug}`,
          description: form.description,
          published: form.published,
        };

    const next: AdminCategory = {
      ...base,
      type: form.type,
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      iconKey: form.iconKey,
      accent: form.accent,
      description: form.description.trim(),
      coverImageUrl: form.coverImageUrl,
      published: form.published,
      href: `/dashboard/trilhas?categoria=${slug}`,
    };

    store.upsertCategory(next);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={category ? "Editar categoria" : "Nova aplicação ou módulo"}
      description="Categorias estruturam trilhas e cursos por produto. Seguem as mesmas cores, ícones e textos do app do aluno."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {category ? "Salvar alterações" : "Criar categoria"}
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
          <Input
            label="Nome"
            required
            placeholder="Ex.: Analytics"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
          <Select
            label="Tipo"
            required
            value={form.type}
            onChange={(e) => update("type", e.target.value as TrackCategoryType)}
            options={CATEGORY_TYPE_OPTIONS}
          />
        </div>

        <Input
          label="Resumo (tagline)"
          required
          placeholder="Insights, dashboards e relatórios estratégicos."
          value={form.tagline}
          onChange={(e) => update("tagline", e.target.value)}
        />

        <Textarea
          label="Descrição"
          placeholder="Detalhe o que o aluno aprende nesta área."
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Ícone"
            value={form.iconKey}
            onChange={(e) => update("iconKey", e.target.value as TrackCategoryIcon)}
            options={ICON_OPTIONS}
          />
          <Select
            label="Cor de destaque"
            value={form.accent}
            onChange={(e) => update("accent", e.target.value as TrackCategoryAccent)}
            options={ACCENT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>

        <MediaField
          label="Imagem de capa"
          kind="image"
          hint="Opcional. Recomendado 16:9, usada como capa da categoria."
          value={form.coverImageUrl}
          onChange={(value) => update("coverImageUrl", value)}
        />

        <label className="flex items-center gap-2.5 text-sm text-foreground-subtitle">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => update("published", e.target.checked)}
            className="h-4 w-4 rounded-[4px] border border-border-default bg-background-elevated checked:border-brand-secondary checked:bg-brand-secondary"
          />
          Publicada (visível para os alunos)
        </label>
      </div>
    </Modal>
  );
}
