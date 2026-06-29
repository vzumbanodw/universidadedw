"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/lib/admin/store";
import { ACCENT_OPTIONS, createId } from "@/lib/admin/options";
import type { MaturityLevel, TrackCategoryAccent } from "@/types/admin";

type MaturityLevelFormDialogProps = {
  open: boolean;
  onClose: () => void;
  level?: MaturityLevel | null;
};

type FormState = {
  name: string;
  description: string;
  minPoints: number;
  maxPoints: string; // vazio = sem teto
  accent: TrackCategoryAccent;
};

const EMPTY: FormState = {
  name: "",
  description: "",
  minPoints: 0,
  maxPoints: "",
  accent: "neutral",
};

export function MaturityLevelFormDialog({
  open,
  onClose,
  level,
}: MaturityLevelFormDialogProps) {
  const store = useAdminStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      level
        ? {
            name: level.name,
            description: level.description,
            minPoints: level.minPoints,
            maxPoints: level.maxPoints === null ? "" : String(level.maxPoints),
            accent: level.accent,
          }
        : EMPTY,
    );
  }, [open, level]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) {
      setError("Informe o nome do nível.");
      return;
    }
    const max = form.maxPoints.trim() === "" ? null : Number(form.maxPoints);
    if (max !== null && max < form.minPoints) {
      setError("O ponto máximo deve ser maior que o mínimo.");
      return;
    }

    const nextOrder =
      level?.order ??
      (store.maturityLevels.length > 0
        ? Math.max(...store.maturityLevels.map((l) => l.order)) + 1
        : 1);

    const next: MaturityLevel = {
      id: level?.id ?? createId("ml"),
      name: form.name.trim(),
      description: form.description.trim(),
      minPoints: Number(form.minPoints) || 0,
      maxPoints: max,
      order: nextOrder,
      accent: form.accent,
    };

    store.upsertMaturityLevel(next);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={level ? "Editar nível" : "Novo nível de maturidade"}
      description="A faixa de pontos define em qual nível o cliente se encontra. Deixe o máximo vazio para o último nível."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {level ? "Salvar" : "Criar nível"}
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
          label="Nome"
          required
          placeholder="Ex.: Operação intermediária"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />
        <Textarea
          label="Descrição"
          rows={2}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Pontos mínimos"
            type="number"
            min={0}
            value={form.minPoints}
            onChange={(e) => update("minPoints", Number(e.target.value))}
          />
          <Input
            label="Pontos máximos"
            type="number"
            min={0}
            placeholder="Vazio = sem teto"
            value={form.maxPoints}
            onChange={(e) => update("maxPoints", e.target.value)}
          />
        </div>
        <Select
          label="Cor (accent)"
          value={form.accent}
          onChange={(e) => update("accent", e.target.value as TrackCategoryAccent)}
          options={ACCENT_OPTIONS.map((a) => ({ value: a.value, label: a.label }))}
        />
      </div>
    </Modal>
  );
}
