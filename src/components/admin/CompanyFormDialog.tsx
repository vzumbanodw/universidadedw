"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MediaField } from "@/components/admin/MediaField";
import { useAdminStore } from "@/lib/admin/store";
import { createId } from "@/lib/admin/options";
import type { Company } from "@/types/admin";

type CompanyFormDialogProps = {
  open: boolean;
  onClose: () => void;
  company?: Company | null;
};

type FormState = {
  name: string;
  segment: string;
  cnpj: string;
  contactName: string;
  contactEmail: string;
  seats: number;
  logoUrl?: string;
};

const EMPTY: FormState = {
  name: "",
  segment: "",
  cnpj: "",
  contactName: "",
  contactEmail: "",
  seats: 10,
  logoUrl: undefined,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CompanyFormDialog({ open, onClose, company }: CompanyFormDialogProps) {
  const store = useAdminStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      company
        ? {
            name: company.name,
            segment: company.segment,
            cnpj: company.cnpj ?? "",
            contactName: company.contactName,
            contactEmail: company.contactEmail,
            seats: company.seats,
            logoUrl: company.logoUrl,
          }
        : EMPTY,
    );
  }, [open, company]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.name.trim()) {
      setError("Informe o nome da empresa.");
      return;
    }
    if (form.contactEmail && !EMAIL_RE.test(form.contactEmail)) {
      setError("E-mail de contato inválido.");
      return;
    }

    const next: Company = {
      id: company?.id ?? createId("co"),
      name: form.name.trim(),
      segment: form.segment.trim(),
      cnpj: form.cnpj.trim() || undefined,
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      seats: Number(form.seats) || 0,
      logoUrl: form.logoUrl,
      createdAt: company?.createdAt ?? new Date().toISOString(),
    };

    store.upsertCompany(next);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={company ? "Editar empresa" : "Nova empresa"}
      description="Empresas agrupam os funcionários que usarão a Universidade para aprender sobre o produto."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {company ? "Salvar" : "Criar empresa"}
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
          label="Nome da empresa"
          required
          placeholder="Ex.: Óptica Boa Vista"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Segmento"
            placeholder="Varejo óptico"
            value={form.segment}
            onChange={(e) => update("segment", e.target.value)}
          />
          <Input
            label="CNPJ"
            placeholder="00.000.000/0001-00"
            value={form.cnpj}
            onChange={(e) => update("cnpj", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Contato responsável"
            placeholder="Nome do responsável"
            value={form.contactName}
            onChange={(e) => update("contactName", e.target.value)}
          />
          <Input
            label="E-mail de contato"
            type="email"
            placeholder="contato@empresa.com.br"
            value={form.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
          />
        </div>

        <Input
          label="Licenças contratadas (assentos)"
          type="number"
          min={0}
          hint="Número de acessos disponíveis para a empresa."
          value={form.seats}
          onChange={(e) => update("seats", Number(e.target.value))}
        />

        <MediaField
          label="Logo da empresa"
          kind="image"
          value={form.logoUrl}
          onChange={(value) => update("logoUrl", value)}
        />
      </div>
    </Modal>
  );
}
