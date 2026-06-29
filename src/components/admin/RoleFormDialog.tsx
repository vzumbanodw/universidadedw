"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/lib/admin/store";
import { ACCESS_LEVEL_OPTIONS, createId } from "@/lib/admin/options";
import { cn } from "@/lib/utils";
import type { AccessLevel, AccessRole } from "@/types/admin";

type RoleFormDialogProps = {
  open: boolean;
  onClose: () => void;
  companyId: string;
  role?: AccessRole | null;
};

type FormState = {
  name: string;
  description: string;
  level: AccessLevel;
  categoryIds: string[];
  courseIds: string[];
};

const EMPTY: FormState = {
  name: "",
  description: "",
  level: "student",
  categoryIds: [],
  courseIds: [],
};

export function RoleFormDialog({ open, onClose, companyId, role }: RoleFormDialogProps) {
  const store = useAdminStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const applications = store.categories.filter((c) => c.type === "aplicacao");
  const modules = store.categories.filter((c) => c.type === "modulo");

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      role
        ? {
            name: role.name,
            description: role.description,
            level: role.level,
            categoryIds: [...role.categoryIds],
            courseIds: [...role.courseIds],
          }
        : EMPTY,
    );
  }, [open, role]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCategory(id: string) {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  }

  function toggleCourse(id: string) {
    setForm((prev) => ({
      ...prev,
      courseIds: prev.courseIds.includes(id)
        ? prev.courseIds.filter((c) => c !== id)
        : [...prev.courseIds, id],
    }));
  }

  function handleSave() {
    if (!form.name.trim()) {
      setError("Dê um nome ao perfil de acesso.");
      return;
    }
    if (form.categoryIds.length === 0 && form.courseIds.length === 0) {
      setError("Libere ao menos uma aplicação, módulo ou curso.");
      return;
    }

    const next: AccessRole = {
      id: role?.id ?? createId("role"),
      companyId,
      name: form.name.trim(),
      description: form.description.trim(),
      level: form.level,
      categoryIds: form.categoryIds,
      courseIds: form.courseIds,
    };

    store.upsertRole(next);
    onClose();
  }

  // Cursos disponíveis para liberação avulsa = cursos que NÃO estão em
  // categorias já liberadas (essas já vêm incluídas).
  const extraCourses = store.courses.filter(
    (course) => !form.categoryIds.includes(course.categoryId),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={role ? "Editar perfil de acesso" : "Novo perfil de acesso"}
      description="Um perfil define o que um tipo de funcionário pode acessar. Ex.: 'Atendimento' libera OptFacil e CRM."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>{role ? "Salvar perfil" : "Criar perfil"}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {error ? (
          <p role="alert" className="rounded-regular border border-border-error bg-background-error px-3.5 py-2.5 text-sm text-foreground-error">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nome do perfil"
            required
            placeholder="Ex.: Atendimento e vendas"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
          <Select
            label="Nível de acesso"
            value={form.level}
            onChange={(e) => update("level", e.target.value as AccessLevel)}
            options={ACCESS_LEVEL_OPTIONS}
          />
        </div>

        <Textarea
          label="Descrição"
          rows={2}
          placeholder="Para quem é este perfil e o que ele cobre."
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />

        <AccessGroup
          title="Aplicações liberadas"
          items={applications.map((c) => ({ id: c.id, label: c.name }))}
          selected={form.categoryIds}
          onToggle={toggleCategory}
        />

        <AccessGroup
          title="Módulos liberados"
          items={modules.map((c) => ({ id: c.id, label: c.name }))}
          selected={form.categoryIds}
          onToggle={toggleCategory}
        />

        {extraCourses.length > 0 ? (
          <AccessGroup
            title="Cursos avulsos (fora das categorias liberadas)"
            items={extraCourses.map((c) => ({
              id: c.id,
              label: `${c.title} · ${c.categoryName}`,
            }))}
            selected={form.courseIds}
            onToggle={toggleCourse}
            columns={1}
          />
        ) : null}
      </div>
    </Modal>
  );
}

function AccessGroup({
  title,
  items,
  selected,
  onToggle,
  columns = 2,
}: {
  title: string;
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  columns?: 1 | 2;
}) {
  if (items.length === 0) return null;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-foreground-subtitle">{title}</legend>
      <div
        className={cn(
          "grid gap-2",
          columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {items.map((item) => {
          const checked = selected.includes(item.id);
          return (
            <label
              key={item.id}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-regular border px-3 py-2.5 text-[13.5px] transition-colors",
                checked
                  ? "border-brand-primary/40 bg-brand-primary/10 text-foreground-heading"
                  : "border-border-subtle bg-background-subtle/50 text-foreground-subtitle hover:border-border-default",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(item.id)}
                className="h-4 w-4 rounded-[4px] border border-border-default bg-background-elevated checked:border-brand-secondary checked:bg-brand-secondary"
              />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
