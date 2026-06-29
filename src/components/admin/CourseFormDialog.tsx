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
  FORMAT_OPTIONS,
  LEVEL_OPTIONS,
  createId,
  slugify,
} from "@/lib/admin/options";
import type {
  AdminCourse,
  CourseFormat,
  LearningLevel,
} from "@/types/admin";

type CourseFormDialogProps = {
  open: boolean;
  onClose: () => void;
  course?: AdminCourse | null;
};

type FormState = {
  title: string;
  description: string;
  categoryId: string;
  level: LearningLevel;
  format: CourseFormat;
  estimatedMinutes: number;
  points: number;
  certificate: boolean;
  featured: boolean;
  published: boolean;
  coverImageUrl?: string;
  promoVideoUrl?: string;
};

const EMPTY: FormState = {
  title: "",
  description: "",
  categoryId: "",
  level: "Iniciante",
  format: "Videoaulas",
  estimatedMinutes: 60,
  points: 0,
  certificate: false,
  featured: false,
  published: true,
  coverImageUrl: undefined,
  promoVideoUrl: undefined,
};

export function CourseFormDialog({ open, onClose, course }: CourseFormDialogProps) {
  const store = useAdminStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = store.categories.map((c) => ({
    value: c.id,
    label: `${c.type === "aplicacao" ? "Aplicação" : "Módulo"} · ${c.name}`,
  }));

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      course
        ? {
            title: course.title,
            description: course.description,
            categoryId: course.categoryId,
            level: course.level,
            format: course.format,
            estimatedMinutes: course.estimatedMinutes,
            points: course.points ?? 0,
            certificate: Boolean(course.certificate),
            featured: Boolean(course.featured),
            published: course.published,
            coverImageUrl: course.coverImageUrl,
            promoVideoUrl: course.promoVideoUrl,
          }
        : { ...EMPTY, categoryId: store.categories[0]?.id ?? "" },
    );
  }, [open, course, store.categories]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.title.trim()) {
      setError("Informe o título do curso.");
      return;
    }
    if (!form.categoryId) {
      setError("Selecione a aplicação ou módulo do curso.");
      return;
    }

    const category = store.categories.find((c) => c.id === form.categoryId);
    if (!category) {
      setError("Categoria inválida.");
      return;
    }

    const slug = slugify(form.title);
    const lessonsCount = course
      ? store.lessonsForCourse(course.id).length
      : 0;

    const next: AdminCourse = {
      id: course?.id ?? createId("course"),
      title: form.title.trim(),
      description: form.description.trim(),
      categoryId: category.id,
      categoryName: category.name,
      categoryType: category.type,
      accent: category.accent,
      level: form.level,
      format: form.format,
      estimatedMinutes: Number(form.estimatedMinutes) || 0,
      points: Number(form.points) || 0,
      lessonsCount,
      progress: course?.progress ?? 0,
      status: course?.status ?? "not_started",
      featured: form.featured,
      certificate: form.certificate,
      href: `/dashboard/cursos/${slug}`,
      coverImageUrl: form.coverImageUrl,
      promoVideoUrl: form.promoVideoUrl,
      published: form.published,
    };

    store.upsertCourse(next);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={course ? "Editar curso" : "Novo curso"}
      description="Cursos pertencem a uma aplicação ou módulo e herdam a cor da categoria, como no app do aluno."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {course ? "Salvar alterações" : "Criar curso"}
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

        <Input
          label="Título"
          required
          placeholder="Ex.: Dashboards executivos no Analytics"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
        />

        <Textarea
          label="Descrição"
          placeholder="O que o aluno será capaz de fazer ao concluir o curso."
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />

        <Select
          label="Aplicação / Módulo"
          required
          placeholder={categoryOptions.length === 0 ? "Crie uma categoria primeiro" : undefined}
          value={form.categoryId}
          onChange={(e) => update("categoryId", e.target.value)}
          options={categoryOptions}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Nível"
            value={form.level}
            onChange={(e) => update("level", e.target.value as LearningLevel)}
            options={LEVEL_OPTIONS}
          />
          <Select
            label="Formato"
            value={form.format}
            onChange={(e) => update("format", e.target.value as CourseFormat)}
            options={FORMAT_OPTIONS}
          />
          <Input
            label="Duração (min)"
            type="number"
            min={0}
            value={form.estimatedMinutes}
            onChange={(e) => update("estimatedMinutes", Number(e.target.value))}
          />
        </div>

        <Input
          label="Pontuação concedida"
          type="number"
          min={0}
          hint="Pontos somados à maturidade do aluno ao concluir o curso."
          value={form.points}
          onChange={(e) => update("points", Number(e.target.value))}
        />

        <MediaField
          label="Imagem de capa"
          kind="image"
          hint="Capa exibida no card do curso."
          value={form.coverImageUrl}
          onChange={(value) => update("coverImageUrl", value)}
        />

        <MediaField
          label="Vídeo de apresentação"
          kind="video"
          hint="Opcional. URL de streaming (Vimeo, YouTube, MUX…)."
          value={form.promoVideoUrl}
          onChange={(value) => update("promoVideoUrl", value)}
        />

        <div className="flex flex-wrap gap-x-6 gap-y-2.5">
          <CheckRow
            label="Gera certificado"
            checked={form.certificate}
            onChange={(v) => update("certificate", v)}
          />
          <CheckRow
            label="Destaque"
            checked={form.featured}
            onChange={(v) => update("featured", v)}
          />
          <CheckRow
            label="Publicado"
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
