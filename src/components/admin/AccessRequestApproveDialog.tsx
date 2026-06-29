"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/lib/admin/store";
import { createId } from "@/lib/admin/options";
import type { AccessRequest } from "@/types/admin";

type Props = {
  open: boolean;
  request: AccessRequest | null;
  onClose: () => void;
};

/**
 * Aprova uma solicitação vinculando a pessoa a uma empresa já cadastrada. Cria
 * o funcionário (status "convidado") nessa empresa e marca a solicitação como
 * aprovada. O operador gera o acesso (login/senha) depois, na empresa.
 */
export function AccessRequestApproveDialog({ open, request, onClose }: Props) {
  const store = useAdminStore();
  const [companyId, setCompanyId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);
    setCompanyId(store.companies[0]?.id ?? "");
  }, [open, store.companies]);

  async function handleApprove() {
    if (!request) return;
    if (!companyId) {
      setError("Selecione uma empresa.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, action: "approve", companyId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Falha ao aprovar.");
        setBusy(false);
        return;
      }
      // Cria o funcionário na empresa escolhida (persistido pelo fluxo de membros).
      store.addMembers([
        {
          id: createId("mb"),
          companyId,
          name: request.name,
          email: request.email,
          status: "invited",
          createdAt: new Date().toISOString(),
        },
      ]);
      store.upsertAccessRequest({
        ...request,
        status: "approved",
        companyId,
        reviewedAt: new Date().toISOString(),
      });
      onClose();
    } catch {
      setError("Falha de rede.");
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Aprovar solicitação"
      description={
        request
          ? `Vincule ${request.name} a uma empresa cadastrada. A pessoa entra como funcionário e você gera o acesso depois.`
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
            disabled={store.companies.length === 0}
          >
            Aprovar e vincular
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
          </div>
        ) : null}

        {store.companies.length === 0 ? (
          <p className="rounded-regular border border-border-warning bg-background-warning px-3.5 py-3 text-sm text-foreground-warning">
            Cadastre uma empresa antes de aprovar solicitações.
          </p>
        ) : (
          <Select
            label="Vincular à empresa"
            required
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            options={store.companies.map((c) => ({ value: c.id, label: c.name }))}
          />
        )}
      </div>
    </Modal>
  );
}
