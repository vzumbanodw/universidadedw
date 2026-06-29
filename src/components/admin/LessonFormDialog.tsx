"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { MediaField } from "@/components/admin/MediaField";
import { useAdminStore } from "@/lib/admin/store";
import { RESOURCE_TYPE_OPTIONS, createId } from "@/lib/admin/options";
import type { AdminLesson, AdminLessonResource } from "@/types/admin";

type LessonFormDialogProps = {
  open: boolean;
  onClose: () => void;
  courseId: string;
  lesson?: AdminLesson | null;
  nextOrder: number;
};

type FormState = {
  title: string;
  description: string;
  durationMinutes: number;
  videoUrl?: string;
  contentTitle: string;
  contentBody: string;
  resources: AdminLessonResource[];
  published: boolean;
};

const EMPTY: FormState = {
  title: "",
  description: "",
  durationMinutes: 8,
  videoUrl: undefined,
  contentTitle: "",
  contentBody: "",
  resources: [],
  published: true,
};

export function LessonFormDialog({
  open,
  onClose,
  courseId,
  lesson,
  nextOrder,
}: LessonFormDialogProps) {
  const store = useAdminStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      lesson
        ? {
            title: lesson.title,
            description: lesson.description,
            durationMinutes: lesson.durationMinutes,
            videoUrl: lesson.videoUrl,
            contentTitle: lesson.contentTitle,
            contentBody: lesson.contentBlocks.join("\n\n"),
            resources: lesson.resources.map((r) => ({ ...r })),
            published: lesson.published,
          }
        : EMPTY,
    );
  }, [open, lesson]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateResource(index: number, patch: Partial<AdminLessonResource>) {
    setForm((prev) => ({
      ...prev,
      resources: prev.resources.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
  }

  function addResource() {
    setForm((prev) => ({
      ...prev,
      resources: [...prev.resources, { label: "", type: "PDF" }],
    }));
  }

  function removeResource(index: number) {
    setForm((prev) => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index),
    }));
  }

  function handleSave() {
    if (!form.title.trim()) {
      setError("Informe o título da aula.");
      return;
    }

    const contentBlocks = form.contentBody
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);

    const next: AdminLesson = {
      id: lesson?.id ?? createId("lesson"),
      courseId,
      order: lesson?.order ?? nextOrder,
      title: form.title.trim(),
      description: form.description.trim(),
      durationMinutes: Number(form.durationMinutes) || 0,
      videoUrl: form.videoUrl,
      contentTitle: form.contentTitle.trim() || form.title.trim(),
      contentBlocks,
      resources: form.resources
        .filter((r) => r.label.trim())
        .map((r) => ({ label: r.label.trim(), type: r.type, url: r.url || undefined })),
      published: form.published,
    };

    store.upsertLesson(next);
    syncCourseLessonCount();
    onClose();
  }

  // Mantém lessonsCount do curso coerente com a quantidade real de aulas.
  function syncCourseLessonCount() {
    const course = store.courses.find((c) => c.id === courseId);
    if (!course) return;
    const count = store.lessonsForCourse(courseId).length + (lesson ? 0 : 1);
    store.upsertCourse({ ...course, lessonsCount: count });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={lesson ? "Editar aula" : "Nova aula"}
      description="Cada aula tem vídeo, conteúdo textual e materiais de apoio, exatamente como o aluno vê no player."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {lesson ? "Salvar aula" : "Adicionar aula"}
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

        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Input
            label="Título da aula"
            required
            placeholder="Ex.: Visão geral e objetivos"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
          <Input
            label="Duração (min)"
            type="number"
            min={0}
            value={form.durationMinutes}
            onChange={(e) => update("durationMinutes", Number(e.target.value))}
          />
        </div>

        <Input
          label="Resumo"
          placeholder="Uma linha sobre o que a aula cobre."
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />

        <MediaField
          label="Vídeo da aula"
          kind="video"
          hint="URL de streaming da videoaula."
          value={form.videoUrl}
          onChange={(value) => update("videoUrl", value)}
        />

        <Input
          label="Título do conteúdo"
          placeholder="Cabeçalho exibido na seção de conteúdo."
          value={form.contentTitle}
          onChange={(e) => update("contentTitle", e.target.value)}
        />

        <Textarea
          label="Conteúdo da aula"
          rows={5}
          hint="Separe parágrafos com uma linha em branco."
          placeholder={"Primeiro parágrafo do conteúdo.\n\nSegundo parágrafo."}
          value={form.contentBody}
          onChange={(e) => update("contentBody", e.target.value)}
        />

        {/* Materiais */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground-subtitle">
              Materiais de apoio
            </span>
            <button
              type="button"
              onClick={addResource}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground-brand hover:underline"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Adicionar material
            </button>
          </div>

          {form.resources.length === 0 ? (
            <p className="rounded-regular border border-dashed border-border-default px-3.5 py-3 text-[13px] text-foreground-muted">
              Nenhum material. Adicione PDFs, checklists ou exercícios.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {form.resources.map((resource, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-2 rounded-regular border border-border-subtle bg-background-subtle/60 p-2.5 sm:grid-cols-[1fr_150px_auto]"
                >
                  <input
                    value={resource.label}
                    onChange={(e) => updateResource(index, { label: e.target.value })}
                    placeholder="Nome do material"
                    className="h-10 rounded-regular border border-border-default bg-background-elevated px-3 text-[14px] text-foreground placeholder:text-foreground-placeholder outline-none focus:border-brand-primary"
                  />
                  <Select
                    aria-label="Tipo do material"
                    value={resource.type}
                    onChange={(e) =>
                      updateResource(index, {
                        type: e.target.value as AdminLessonResource["type"],
                      })
                    }
                    options={RESOURCE_TYPE_OPTIONS}
                    className="[&_select]:h-10 [&>div]:h-10"
                  />
                  <button
                    type="button"
                    onClick={() => removeResource(index)}
                    aria-label="Remover material"
                    className="inline-flex h-10 w-10 items-center justify-center justify-self-end rounded-regular border border-border-subtle text-foreground-muted transition-colors hover:border-border-error hover:bg-background-error hover:text-foreground-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2.5 text-sm text-foreground-subtitle">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => update("published", e.target.checked)}
            className="h-4 w-4 rounded-[4px] border border-border-default bg-background-elevated checked:border-brand-secondary checked:bg-brand-secondary"
          />
          Publicada
        </label>
      </div>
    </Modal>
  );
}
