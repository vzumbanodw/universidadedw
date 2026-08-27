"use client";

import { useEffect, useState } from "react";
import { Building2, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MediaField } from "@/components/admin/MediaField";
import { useAdminStore } from "@/lib/admin/store";
import { createId } from "@/lib/admin/options";
import { logAction } from "@/lib/admin/audit-client";
import { formatCnpj, isValidCnpj, stripCnpj } from "@/lib/validators/cnpj";
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

/** Normaliza o nome para comparação: minúsculas, sem espaços duplicados. */
function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function CompanyFormDialog({ open, onClose, company }: CompanyFormDialogProps) {
  const store = useAdminStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  // Empresas já cadastradas iguais à digitada — pede confirmação antes de criar.
  const [duplicates, setDuplicates] = useState<Company[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDuplicates(null);
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

  /** Empresas existentes com o mesmo nome (normalizado) ou mesmo CNPJ. */
  function findDuplicates(): Company[] {
    const name = normalizeName(form.name);
    const cnpj = stripCnpj(form.cnpj);
    return store.companies.filter((c) => {
      if (c.id === company?.id) return false; // edição: não compara consigo mesma
      const sameName = normalizeName(c.name) === name;
      const sameCnpj = cnpj.length > 0 && stripCnpj(c.cnpj ?? "") === cnpj;
      return sameName || sameCnpj;
    });
  }

  function doSave() {
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
    logAction(`${company ? "Editou" : "Cadastrou"} a empresa "${next.name}"`);
    onClose();
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
    if (form.cnpj.trim() && !isValidCnpj(form.cnpj)) {
      setError("CNPJ inválido. Confira os dígitos.");
      return;
    }

    // Já existe empresa igual? Pergunta antes — duplicar é permitido, mas
    // precisa ser uma decisão consciente do operador.
    const found = findDuplicates();
    if (found.length > 0) {
      setError(null);
      setDuplicates(found);
      return;
    }

    doSave();
  }

  // ---- Etapa de confirmação: empresa possivelmente duplicada ----------------
  if (duplicates && duplicates.length > 0) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        size="md"
        title="Empresa já cadastrada"
        description={`Encontramos ${duplicates.length === 1 ? "uma empresa igual" : `${duplicates.length} empresas iguais`} no sistema. Deseja cadastrar mesmo assim?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDuplicates(null)}>
              Voltar e revisar
            </Button>
            <Button onClick={doSave} leftIcon={<Building2 className="h-4 w-4" />}>
              Cadastrar mesmo assim
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2.5 rounded-regular border border-border-error/60 bg-background-error px-3.5 py-3">
            <TriangleAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-icon-error"
              aria-hidden
            />
            <p className="text-[13px] leading-relaxed text-foreground-error">
              Duplicar é permitido (há casos específicos que precisam disso),
              mas confirme que não é um cadastro repetido por engano.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {duplicates.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-regular border border-border-subtle bg-background-subtle/50 px-3.5 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-regular bg-background-subtle text-foreground-subtitle">
                  <Building2 className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 text-[13px]">
                  <p className="font-medium text-foreground-heading">{c.name}</p>
                  <p className="text-foreground-muted">
                    {[c.segment || null, c.cnpj ? `CNPJ ${c.cnpj}` : null, `${store.membersForCompany(c.id).length} funcionário(s)`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    );
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
            placeholder="00.000.000/0000-00"
            value={form.cnpj}
            onChange={(e) => update("cnpj", formatCnpj(e.target.value))}
            maxLength={18}
            autoComplete="off"
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
