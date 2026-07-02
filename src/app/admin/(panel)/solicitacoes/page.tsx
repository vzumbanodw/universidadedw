"use client";

import { useEffect, useState } from "react";
import { Check, Inbox, KeyRound, Mail, X } from "lucide-react";
import { AdminPageHeader, EmptyState, Panel } from "@/components/admin/AdminPrimitives";
import { AccessRequestApproveDialog } from "@/components/admin/AccessRequestApproveDialog";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/lib/admin/store";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  ACCESS_REQUEST_STATUS_LABEL,
  PASSWORD_RESET_STATUS_LABEL,
  type AccessRequest,
  type AccessRequestStatus,
  type PasswordResetRequest,
  type PasswordResetStatus,
} from "@/types/admin";

const STATUS_VARIANT: Record<AccessRequestStatus, "orange" | "success" | "neutral"> = {
  pending: "orange",
  approved: "success",
  rejected: "neutral",
};

const RESET_STATUS_VARIANT: Record<
  PasswordResetStatus,
  "orange" | "success" | "neutral" | "primary"
> = {
  pending: "orange",
  approved: "primary",
  rejected: "neutral",
  used: "success",
};

export default function SolicitacoesPage() {
  const store = useAdminStore();
  const [approving, setApproving] = useState<AccessRequest | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resets, setResets] = useState<PasswordResetRequest[]>([]);
  const [resetBusyId, setResetBusyId] = useState<string | null>(null);

  const pending = store.accessRequests.filter((r) => r.status === "pending");
  const history = store.accessRequests
    .filter((r) => r.status !== "pending")
    .slice()
    .reverse();

  const resetPending = resets.filter((r) => r.status === "pending");
  const resetReviewed = resets.filter((r) => r.status !== "pending").slice(0, 10);

  // Carrega as solicitações de redefinição de senha (tabela dedicada).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/password-resets")
      .then((res) => (res.ok ? res.json() : { requests: [] }))
      .then((data: { requests?: PasswordResetRequest[] }) => {
        if (!cancelled) setResets(data.requests ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function reviewReset(req: PasswordResetRequest, action: "approve" | "reject") {
    if (
      action === "reject" &&
      !window.confirm(`Recusar a redefinição de senha de "${req.email}"?`)
    ) {
      return;
    }
    setResetBusyId(req.id);
    try {
      const res = await fetch("/api/admin/password-resets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: req.id, action }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        request?: PasswordResetRequest;
      };
      if (res.ok && data.ok && data.request) {
        const updated = data.request;
        setResets((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        window.alert(data.error ?? "Falha ao revisar a solicitação.");
      }
    } finally {
      setResetBusyId(null);
    }
  }

  async function reject(req: AccessRequest) {
    if (!window.confirm(`Recusar a solicitação de "${req.name}"?`)) return;
    setBusyId(req.id);
    try {
      const res = await fetch("/api/admin/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: req.id, action: "reject" }),
      });
      if (res.ok) {
        store.upsertAccessRequest({
          ...req,
          status: "rejected",
          reviewedAt: new Date().toISOString(),
        });
      } else {
        const data = (await res.json()) as { error?: string };
        window.alert(data.error ?? "Falha ao recusar.");
      }
    } finally {
      setBusyId(null);
    }
  }

  function companyName(companyId?: string): string | undefined {
    return store.companies.find((c) => c.id === companyId)?.name;
  }

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Backoffice", href: "/admin" }, { label: "Solicitações" }]}
        title="Solicitações de acesso"
        description="Pedidos enviados pela tela de login do Universidade. Aprove vinculando a pessoa a uma empresa cadastrada, ou recuse."
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
          Pendentes {pending.length > 0 ? `(${pending.length})` : ""}
        </h2>

        {pending.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nenhuma solicitação pendente"
            description="Quando alguém solicitar acesso pela tela de login, o pedido aparece aqui para aprovação."
          />
        ) : (
          <Panel className="divide-y divide-border-subtle overflow-hidden">
            {pending.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={req.name} size="sm" />
                  <div className="min-w-0">
                    <h3 className="truncate text-[14px] font-semibold text-foreground-heading">
                      {req.name}
                    </h3>
                    <p className="flex flex-wrap items-center gap-x-1.5 truncate text-[12.5px] text-foreground-muted">
                      <Mail className="h-3 w-3 shrink-0" aria-hidden />
                      {req.email}
                      {req.companyName ? (
                        <span className="text-foreground-muted">· {req.companyName}</span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    leftIcon={<Check className="h-4 w-4" />}
                    onClick={() => setApproving(req)}
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<X className="h-4 w-4" />}
                    loading={busyId === req.id}
                    onClick={() => reject(req)}
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </Panel>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
          Redefinição de senha{" "}
          {resetPending.length > 0 ? `(${resetPending.length})` : ""}
        </h2>

        {resetPending.length === 0 && resetReviewed.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title="Nenhuma redefinição solicitada"
            description='Quando um aluno usar "Esqueci minha senha" no login, o pedido aparece aqui. Ao aprovar, ele define a nova senha em "Primeiro acesso" — sem perder o progresso.'
          />
        ) : (
          <Panel className="divide-y divide-border-subtle overflow-hidden">
            {resetPending.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-orange/15 text-[#B97A0F]">
                    <KeyRound className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-[14px] font-semibold text-foreground-heading">
                      {req.email}
                    </h3>
                    <p className="text-[12.5px] text-foreground-muted">
                      Solicitado em {formatDate(req.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    leftIcon={<Check className="h-4 w-4" />}
                    loading={resetBusyId === req.id}
                    onClick={() => reviewReset(req, "approve")}
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<X className="h-4 w-4" />}
                    loading={resetBusyId === req.id}
                    onClick={() => reviewReset(req, "reject")}
                  >
                    Recusar
                  </Button>
                </div>
              </div>
            ))}

            {resetReviewed.map((req) => (
              <div
                key={req.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 sm:px-5",
                  req.status === "rejected" ? "opacity-70" : undefined,
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background-subtle text-foreground-muted">
                  <KeyRound className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[13.5px] font-medium text-foreground-heading">
                    {req.email}
                  </h3>
                  <p className="text-[12px] text-foreground-muted">
                    Solicitado em {formatDate(req.createdAt)}
                  </p>
                </div>
                <Badge variant={RESET_STATUS_VARIANT[req.status]} size="sm" dot>
                  {PASSWORD_RESET_STATUS_LABEL[req.status]}
                </Badge>
              </div>
            ))}
          </Panel>
        )}
      </section>

      {history.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
            Histórico
          </h2>
          <Panel className="divide-y divide-border-subtle overflow-hidden">
            {history.map((req) => (
              <div
                key={req.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 sm:px-5",
                  req.status === "rejected" ? "opacity-70" : undefined,
                )}
              >
                <Avatar name={req.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[13.5px] font-medium text-foreground-heading">
                    {req.name}
                  </h3>
                  <p className="truncate text-[12px] text-foreground-muted">
                    {req.email}
                    {req.status === "approved" && companyName(req.companyId)
                      ? ` · ${companyName(req.companyId)}`
                      : null}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[req.status]} size="sm" dot>
                  {ACCESS_REQUEST_STATUS_LABEL[req.status]}
                </Badge>
              </div>
            ))}
          </Panel>
        </section>
      ) : null}

      <AccessRequestApproveDialog
        open={Boolean(approving)}
        request={approving}
        onClose={() => setApproving(null)}
      />
    </div>
  );
}
