"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminStore } from "@/lib/admin/store";
import {
  ACCENT_OPTIONS,
  LEVEL_OPTIONS,
  createId,
  slugify,
} from "@/lib/admin/options";
import type {
  LearningLevel,
  LearningTrail,
  TrackCategoryAccent,
} from "@/types/admin";

type TrailFormDialogProps = {
  open: boolean;
  onClose: () => void;
  trail?: LearningTrail | null;
};

type FormState = {
  title: string;
  description: string;
  targetAudience: string;
  level: LearningLevel;
  accent: TrackCategoryAccent;
  points: number;
  hasCertificate: boolean;
  published: boolean;
  courseIds: string[];
};

const EMPTY: FormState = {
  title: "",
  description: "",
  targetAudience: "",
  level: "Iniciante",
  accent: "teal",
  points: 0,
  hasCertificate: false,
  published: true,
  courseIds: [],
};

export function TrailFormDialog({ open, onClose, trail }: TrailFormDialogProps) {
  const store = useAdminStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      trail
        ? {
            title: trail.title,
            description: trail.description,
            targetAudience: trail.targetAudience,
            level: trail.level,
            accent: trail.accent,
            points: trail.points,
            hasCertificate: trail.hasCertificate,
            published: trail.published,
            courseIds: trail.courseIds,
          }
        : EMPTY,
    );
  }, [open, trail]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCourse(courseId: string) {
    setForm((prev) => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter((id) => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
  }

  function handleSave() {
    if (!form.title.trim()) {
      setError("Informe o título da trilha.");
      return;
    }
    if (form.courseIds.length === 0) {
      setError("Selecione ao menos um curso para a trilha.");
      return;
    }

    const now = new Date().toISOString();
    const next: LearningTrail = {
      id: trail?.id ?? createId("trail"),
      title: form.title.trim(),
      slug: slugify(form.title),
      description: form.description.trim(),
      targetAudience: form.targetAudience.trim(),
      level: form.level,
      accent: form.accent,
      courseIds: form.courseIds,
      points: Number(form.points) || 0,
      hasCertificate: form.hasCertificate,
      published: form.published,
      createdAt: trail?.createdAt ?? now,
      updatedAt: now,
    };

    store.upsertTrail(next);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={trail ? "Editar trilha" : "Nova trilha"}
      description="Trilhas agrupam cursos numa jornada com objetivo de formação. A ordem dos cursos é definida na página da trilha."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {trail ? "Salvar alterações" : "Criar trilha"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p
            role="alert"
            className="rounded-regular border border-border-error bg-background-error px-3.5 py-2.5 text-sm text-foreground-error"
          >
            {error}
          </p>
        ) : null}

        <Input
          label="Título"
          required
          placeholder="Ex.: Trilha de Atendimento e Vendas"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
        />

        <Textarea
          label="Descrição"
          placeholder="O que o aluno conquista ao concluir a trilha."
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Público-alvo"
            placeholder="Ex.: Equipe de atendimento"
            value={form.targetAudience}
            onChange={(e) => update("targetAudience", e.target.value)}
          />
          <Input
            label="Pontuação total"
            type="number"
            min={0}
            value={form.points}
            onChange={(e) => update("points", Number(e.target.value))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Nível"
            value={form.level}
            onChange={(e) => update("level", e.target.value as LearningLevel)}
            options={LEVEL_OPTIONS}
          />
          <Select
            label="Cor (accent)"
            value={form.accent}
            onChange={(e) =>
              update("accent", e.target.value as TrackCategoryAccent)
            }
            options={ACCENT_OPTIONS.map((a) => ({ value: a.value, label: a.label }))}
          />
        </div>

        {/* Seleção de cursos */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground-subtitle">
            Cursos da trilha
            <span className="ml-0.5 text-foreground-error">*</span>
          </p>
          {store.courses.length === 0 ? (
            <p className="rounded-regular border border-border-subtle bg-background-subtle px-3.5 py-3 text-[13px] text-foreground-muted">
              Cadastre cursos antes de montar uma trilha.
            </p>
          ) : (
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-regular border border-border-subtle p-1.5">
              {store.courses.map((course) => {
                const checked = form.courseIds.includes(course.id);
                const position = form.courseIds.indexOf(course.id) + 1;
                return (
                  <label
                    key={course.id}
                    className="flex cursor-pointer items-center gap-3 rounded-regular px-2.5 py-2 transition-colors hover:bg-background-subtle"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCourse(course.id)}
                      className="h-4 w-4 rounded-[4px] border border-border-default bg-background-elevated checked:border-brand-secondary checked:bg-brand-secondary"
                    />
                    <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground">
                      {course.title}
                    </span>
                    {checked ? (
                      <Badge variant="primary" size="sm">
                        {position}º
                      </Badge>
                    ) : (
                      <span className="text-[11px] uppercase tracking-[0.08em] text-foreground-muted">
                        {course.categoryName}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2.5">
          <CheckRow
            label="Emite certificado final"
            checked={form.hasCertificate}
            onChange={(v) => update("hasCertificate", v)}
          />
          <CheckRow
            label="Publicada"
            checked={form.published}
            onChange={(v) => update("published", v)}
          />
        </div>
      </div>
    </Modal>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-foreground-subtitle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded-[4px] border border-border-default bg-background-elevated checked:border-brand-secondary checked:bg-brand-secondary"
      />
      {label}
    </label>
  );
}
