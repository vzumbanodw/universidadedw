"use client";

import { useState } from "react";
import { Check, Inbox, Mail, X } from "lucide-react";
import { AdminPageHeader, EmptyState, Panel } from "@/components/admin/AdminPrimitives";
import { AccessRequestApproveDialog } from "@/components/admin/AccessRequestApproveDialog";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/lib/admin/store";
import { cn } from "@/lib/utils";
import {
  ACCESS_REQUEST_STATUS_LABEL,
  type AccessRequest,
  type AccessRequestStatus,
} from "@/types/admin";

const STATUS_VARIANT: Record<AccessRequestStatus, "orange" | "success" | "neutral"> = {
  pending: "orange",
  approved: "success",
  rejected: "neutral",
};

export default function SolicitacoesPage() {
  const store = useAdminStore();
  const [approving, setApproving] = useState<AccessRequest | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = store.accessRequests.filter((r) => r.status === "pending");
  const history = store.accessRequests
    .filter((r) => r.status !== "pending")
    .slice()
    .reverse();

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
