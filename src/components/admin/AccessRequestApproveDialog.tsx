"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Check, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/lib/admin/store";
import { createId } from "@/lib/admin/options";
import { logAction } from "@/lib/admin/audit-client";
import { stripCnpj } from "@/lib/validators/cnpj";
import type { AccessRequest, Company } from "@/types/admin";

type Props = {
  open: boolean;
  request: AccessRequest | null;
  onClose: () => void;
};

type Mode = "existing" | "create";

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Localiza a empresa da solicitação entre as cadastradas: primeiro pelo CNPJ
 * (sem pontuação), depois pelo nome normalizado. null se não houver match.
 */
function matchCompany(request: AccessRequest, companies: Company[]): Company | null {
  const cnpj = stripCnpj(request.cnpj ?? "");
  if (cnpj) {
    const byCnpj = companies.find((c) => stripCnpj(c.cnpj ?? "") === cnpj);
    if (byCnpj) return byCnpj;
  }
  const name = normalizeName(request.companyName ?? "");
  if (name) {
    const byName = companies.find((c) => normalizeName(c.name) === name);
    if (byName) return byName;
  }
  return null;
}

/**
 * Aprova uma solicitação vinculando a pessoa a uma empresa. A empresa é
 * identificada automaticamente pelo CNPJ/nome informados na solicitação; se
 * ainda não existir, o operador pode CRIÁ-LA aqui mesmo (nome + CNPJ da
 * solicitação) e vincular na sequência. Cria o funcionário (status
 * "convidado") e marca a solicitação como aprovada.
 */
export function AccessRequestApproveDialog({ open, request, onClose }: Props) {
  const store = useAdminStore();
  const [companyId, setCompanyId] = useState("");
  const [mode, setMode] = useState<Mode>("existing");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const matched = useMemo(
    () => (request ? matchCompany(request, store.companies) : null),
    [request, store.companies],
  );
  const canCreate = Boolean(request?.companyName?.trim());

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);
    if (matched) {
      setMode("existing");
      setCompanyId(matched.id);
    } else if (canCreate) {
      // Sem empresa correspondente: sugere criar a partir da solicitação.
      setMode("create");
      setCompanyId(store.companies[0]?.id ?? "");
    } else {
      setMode("existing");
      setCompanyId(store.companies[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, matched, canCreate]);

  async function handleApprove() {
    if (!request) return;

    let targetId = companyId;
    let createdCompany: Company | null = null;

    if (mode === "create") {
      const name = (request.companyName ?? "").trim();
      if (!name) {
        setError("A solicitação não informou o nome da empresa.");
        return;
      }
      createdCompany = {
        id: createId("co"),
        name,
        segment: "",
        cnpj: request.cnpj || undefined,
        contactName: request.name,
        contactEmail: request.email,
        seats: 10,
        createdAt: new Date().toISOString(),
      };
      targetId = createdCompany.id;
    } else if (!targetId) {
      setError("Selecione uma empresa.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, action: "approve", companyId: targetId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Falha ao aprovar.");
        setBusy(false);
        return;
      }

      if (createdCompany) {
        store.upsertCompany(createdCompany);
        logAction(
          `Cadastrou a empresa "${createdCompany.name}"${createdCompany.cnpj ? ` (CNPJ ${createdCompany.cnpj})` : ""} a partir da solicitação de "${request.name}"`,
        );
      }

      // Cria o funcionário na empresa escolhida (persistido pelo fluxo de membros).
      store.addMembers([
        {
          id: createId("mb"),
          companyId: targetId,
          name: request.name,
          email: request.email,
          status: "invited",
          createdAt: new Date().toISOString(),
        },
      ]);
      store.upsertAccessRequest({
        ...request,
        status: "approved",
        companyId: targetId,
        reviewedAt: new Date().toISOString(),
      });
      onClose();
    } catch {
      setError("Falha de rede.");
      setBusy(false);
    }
  }

  const selectedCompany = store.companies.find((c) => c.id === companyId);
  const approveDisabled =
    mode === "create" ? !canCreate : store.companies.length === 0 || !companyId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Aprovar solicitação"
      description={
        request
          ? `Vincule ${request.name} à empresa dele. A pessoa entra como funcionário e recebe por e-mail o link para criar a senha.`
          : undefined
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleApprove}
            loading={busy}
            leftIcon={<Check className="h-4 w-4" />}
            disabled={approveDisabled}
          >
            {mode === "create" ? "Criar empresa e aprovar" : "Aprovar e vincular"}
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

        {request ? (
          <div className="rounded-regular border border-border-subtle bg-background-subtle/50 px-3.5 py-3 text-[13px]">
            <p className="font-medium text-foreground-heading">{request.name}</p>
            <p className="text-foreground-muted">{request.email}</p>
            {request.companyName ? (
              <p className="mt-0.5 text-foreground-muted">
                Empresa informada: {request.companyName}
              </p>
            ) : null}
            {request.cnpj ? (
              <p className="mt-0.5 text-foreground-muted">CNPJ: {request.cnpj}</p>
            ) : null}
          </div>
        ) : null}

        {/* Escolha: vincular a existente ou criar a partir da solicitação */}
        {request ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ModeOption
              active={mode === "existing"}
              disabled={store.companies.length === 0}
              onClick={() => setMode("existing")}
              icon={<Building2 className="h-4 w-4" aria-hidden />}
              title="Empresa já cadastrada"
              subtitle={
                matched
                  ? `Identificada pelo ${stripCnpj(request.cnpj ?? "") && stripCnpj(matched.cnpj ?? "") === stripCnpj(request.cnpj ?? "") ? "CNPJ" : "nome"}: ${matched.name}`
                  : "Nenhuma empresa corresponde ao CNPJ/nome informado"
              }
            />
            <ModeOption
              active={mode === "create"}
              disabled={!canCreate}
              onClick={() => setMode("create")}
              icon={<Sparkles className="h-4 w-4" aria-hidden />}
              title="Criar a partir da solicitação"
              subtitle={
                canCreate
                  ? `Nova empresa "${request.companyName}"${request.cnpj ? ` · CNPJ ${request.cnpj}` : ""}`
                  : "A solicitação não informou a empresa"
              }
            />
          </div>
        ) : null}

        {mode === "existing" ? (
          store.companies.length === 0 ? (
            <p className="rounded-regular border border-border-warning bg-background-warning px-3.5 py-3 text-sm text-foreground-warning">
              Nenhuma empresa cadastrada ainda — use a opção de criar a partir da
              solicitação.
            </p>
          ) : (
            <Select
              label="Vincular à empresa"
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              options={store.companies.map((c) => ({
                value: c.id,
                label: c.cnpj ? `${c.name} · ${c.cnpj}` : c.name,
              }))}
              hint={
                matched && selectedCompany?.id === matched.id
                  ? "Selecionada automaticamente a partir da solicitação."
                  : undefined
              }
            />
          )
        ) : (
          <p className="rounded-regular border border-border-subtle bg-background-subtle/50 px-3.5 py-3 text-[13px] leading-relaxed text-foreground-muted">
            A empresa será cadastrada com o nome e o CNPJ informados na
            solicitação, tendo {request?.name} como contato e 10 licenças
            iniciais — você pode ajustar tudo depois em Empresas.
          </p>
        )}
      </div>
    </Modal>
  );
}

function ModeOption({
  active,
  disabled,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={[
        "flex items-start gap-2.5 rounded-regular border px-3.5 py-3 text-left transition-colors",
        active
          ? "border-brand-primary bg-brand-primary/10"
          : "border-border-subtle bg-background-elevated hover:border-border-default hover:bg-background-subtle",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
    >
      <span className={active ? "mt-0.5 text-brand-primary" : "mt-0.5 text-foreground-muted"}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-foreground-heading">{title}</span>
        <span className="block text-[12px] leading-snug text-foreground-muted">{subtitle}</span>
      </span>
    </button>
  );
}
