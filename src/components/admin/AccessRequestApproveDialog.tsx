"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, Copy, Link2, Sparkles } from "lucide-react";
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

/**
 * Duas etapas: primeiro CONFERIR os dados (nada é aprovado aqui), depois
 * VINCULAR a empresa e aprovar. Evita aprovação acidental de quem só abriu a
 * solicitação para checar as informações.
 */
type Step = "review" | "assign";

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
  const [step, setStep] = useState<Step>("review");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Link de criação de senha do aprovado — exibido para o operador entregar
  // manualmente (não depende de o e-mail automático chegar).
  const [approvedLink, setApprovedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const matched = useMemo(
    () => (request ? matchCompany(request, store.companies) : null),
    [request, store.companies],
  );
  const canCreate = Boolean(request?.companyName?.trim());

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);
    setApprovedLink(null);
    setCopied(false);
    setStep("review");
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
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        activationLink?: string | null;
        activationToken?: string | null;
      };
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

      const link =
        data.activationLink ||
        (data.activationToken
          ? `${typeof window !== "undefined" ? window.location.origin : ""}/primeiro-acesso?token=${data.activationToken}`
          : "");
      if (link) {
        setApprovedLink(link);
        setBusy(false);
      } else {
        onClose();
      }
    } catch {
      setError("Falha de rede.");
      setBusy(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard indisponível: o operador copia manualmente */
    }
  }

  // ---- Aprovada: entrega o link de criação de senha ao operador -------------
  if (approvedLink && request) {
    const mensagem =
      `Olá, ${request.name}! Seu acesso à Universidade Dataweb foi aprovado. ` +
      `Crie a sua senha por este link: ${approvedLink}`;
    return (
      <Modal
        open={open}
        onClose={onClose}
        size="md"
        title="Solicitação aprovada"
        description={`${request.name} foi vinculado(a) à empresa e recebeu o e-mail com o link de criação de senha.`}
        footer={<Button onClick={onClose}>Concluir</Button>}
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-regular border border-border-success/40 bg-background-success px-3.5 py-3">
            <p className="flex items-center gap-2 text-[12.5px] font-medium text-foreground-success">
              <Link2 className="h-4 w-4 shrink-0" aria-hidden />
              Se o e-mail não chegar, envie este link direto para a pessoa:
            </p>
            <p className="mt-2 break-all rounded-small bg-background-elevated px-2.5 py-2 font-mono text-[12px] text-foreground-heading">
              {approvedLink}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => copyText(approvedLink)}
              leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? "Copiado" : "Copiar link"}
            </Button>
            <Button variant="ghost" onClick={() => copyText(mensagem)}>
              Copiar mensagem pronta
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // ---- Etapa 1: conferência dos dados (nada é aprovado aqui) ---------------
  if (step === "review" && request) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        size="md"
        title="Conferir solicitação"
        description="Verifique as informações antes de aprovar a solicitação."
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
            <Button
              onClick={() => setStep("assign")}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continuar para aprovação
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <dl className="flex flex-col gap-2">
            <DetailRow label="Nome" value={request.name} strong />
            <DetailRow label="E-mail" value={request.email} />
            <DetailRow label="Empresa informada" value={request.companyName || "—"} />
            <DetailRow label="CNPJ" value={request.cnpj || "—"} />
            <DetailRow
              label="Solicitado em"
              value={
                request.createdAt
                  ? new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "America/Sao_Paulo",
                    }).format(new Date(request.createdAt))
                  : "—"
              }
            />
          </dl>

          <div
            className={
              matched
                ? "flex items-start gap-2.5 rounded-regular border border-border-success/40 bg-background-success px-3.5 py-3"
                : "flex items-start gap-2.5 rounded-regular border border-border-subtle bg-background-subtle/50 px-3.5 py-3"
            }
          >
            <Building2
              className={
                matched
                  ? "mt-0.5 h-4 w-4 shrink-0 text-foreground-success"
                  : "mt-0.5 h-4 w-4 shrink-0 text-foreground-muted"
              }
              aria-hidden
            />
            <p
              className={
                matched
                  ? "text-[13px] leading-relaxed text-foreground-success"
                  : "text-[13px] leading-relaxed text-foreground-muted"
              }
            >
              {matched ? (
                <>
                  Empresa localizada no sistema:{" "}
                  <strong className="font-semibold">{matched.name}</strong>
                  {matched.cnpj ? ` · CNPJ ${matched.cnpj}` : ""}.
                </>
              ) : canCreate ? (
                <>
                  Nenhuma empresa cadastrada corresponde a esses dados — na
                  próxima etapa você pode criá-la a partir da solicitação.
                </>
              ) : (
                <>A solicitação não informou empresa. Escolha uma na próxima etapa.</>
              )}
            </p>
          </div>
        </div>
      </Modal>
    );
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
          <Button
            variant="ghost"
            onClick={() => setStep("review")}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Voltar
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

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-regular border border-border-subtle bg-background-subtle/40 px-3.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="shrink-0 text-[11px] font-medium uppercase tracking-[0.08em] text-foreground-muted sm:w-[132px]">
        {label}
      </dt>
      <dd
        className={
          strong
            ? "break-words text-[14px] font-semibold text-foreground-heading"
            : "break-words text-[13.5px] text-foreground-heading"
        }
      >
        {value}
      </dd>
    </div>
  );
}
