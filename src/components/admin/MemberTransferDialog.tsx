"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, ShieldCheck, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/lib/admin/store";
import type { CompanyMember } from "@/types/admin";

type Props = {
  open: boolean;
  member: CompanyMember | null;
  onClose: () => void;
};

/**
 * Move um funcionário para OUTRA empresa (corrige cadastro na empresa errada).
 *
 * A troca é apenas a atualização do vínculo (`companyId`): a conta no Supabase
 * Auth, as aulas concluídas (`lesson_completions` é por usuário, sem empresa)
 * e os certificados são preservados integralmente. Assentos lotados na empresa
 * de destino geram AVISO, mas não bloqueiam (decisão de produto).
 */
export function MemberTransferDialog({ open, member, onClose }: Props) {
  const store = useAdminStore();
  const [targetId, setTargetId] = useState("");
  const [busy, setBusy] = useState(false);

  const options = useMemo(
    () => store.companies.filter((c) => c.id !== member?.companyId),
    [store.companies, member?.companyId],
  );

  useEffect(() => {
    if (!open) return;
    setBusy(false);
    setTargetId(options[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!member) return null;

  const from = store.companies.find((c) => c.id === member.companyId);
  const target = store.companies.find((c) => c.id === targetId);
  const targetMembers = target ? store.membersForCompany(target.id) : [];
  const willOverflow = Boolean(
    target && target.seats > 0 && targetMembers.length + 1 > target.seats,
  );

  function handleTransfer() {
    if (!member || !target) return;
    setBusy(true);
    store.upsertMember({ ...member, companyId: target.id });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Trocar de empresa"
      description={`Mover ${member.name} de "${from?.name ?? "—"}" para outra empresa cadastrada.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleTransfer}
            loading={busy}
            disabled={!target}
            leftIcon={<ArrowLeftRight className="h-4 w-4" />}
          >
            Trocar empresa
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {options.length === 0 ? (
          <p className="rounded-regular border border-border-warning bg-background-warning px-3.5 py-3 text-sm text-foreground-warning">
            Não há outra empresa cadastrada para receber este funcionário.
          </p>
        ) : (
          <>
            <Select
              label="Empresa de destino"
              required
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              options={options.map((c) => {
                const count = store.membersForCompany(c.id).length;
                return {
                  value: c.id,
                  label: `${c.name} (${count}/${c.seats} assentos)`,
                };
              })}
            />

            {willOverflow && target ? (
              <div className="flex items-start gap-2.5 rounded-regular border border-border-warning bg-background-warning px-3.5 py-3">
                <TriangleAlert
                  className="mt-0.5 h-4 w-4 shrink-0 text-foreground-warning"
                  aria-hidden
                />
                <p className="text-[13px] leading-relaxed text-foreground-warning">
                  <strong className="font-semibold">{target.name}</strong> está com
                  todos os {target.seats} assentos ocupados. A troca vai prosseguir
                  e a ocupação passa a {targetMembers.length + 1}/{target.seats} —
                  ajuste as licenças da empresa depois, se necessário.
                </p>
              </div>
            ) : null}

            <div className="flex items-start gap-2.5 rounded-regular border border-border-subtle bg-background-subtle/50 px-3.5 py-3">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-foreground-success"
                aria-hidden
              />
              <p className="text-[13px] leading-relaxed text-foreground-muted">
                O histórico do aluno é preservado por completo: login e senha,
                aulas concluídas, progresso e certificados continuam intactos —
                muda apenas o vínculo de empresa.
              </p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
