"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Título do diálogo (ex.: "Remover funcionário"). */
  title: string;
  /** O que será excluído, em texto claro para quem confirma. */
  description: string;
  /** Identificação do alvo para a linha de auditoria no servidor. */
  target: string;
  /** Rótulo do botão de confirmação (ex.: "Remover funcionário"). */
  confirmLabel: string;
  /** Executa a exclusão de fato — chamado só após a senha ser validada. */
  onConfirmed: () => void | Promise<void>;
};

/**
 * Confirmação de exclusão com dupla checagem de segurança: quem está
 * removendo se identifica pelo nome e digita a senha do administrador, que é
 * validada no SERVIDOR (/api/admin/confirm-delete) antes de a exclusão rodar.
 * Cada confirmação fica registrada nos logs do servidor (auditoria).
 */
export function DeleteConfirmDialog({
  open,
  onClose,
  title,
  description,
  target,
  confirmLabel,
  onConfirmed,
}: Props) {
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setError(null);
    setBusy(false);
    // Quem confirma é o operador LOGADO (conta individual ou master).
    fetch("/api/admin/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { name?: string } | null) => setOperatorName(data?.name ?? null))
      .catch(() => setOperatorName(null));
  }, [open]);

  async function handleConfirm() {
    if (!password) {
      setError("Informe a sua senha.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/confirm-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, target }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Não foi possível confirmar. Tente novamente.");
        setBusy(false);
        return;
      }
      await onConfirmed();
      onClose();
    } catch {
      setError("Falha de rede. Tente novamente.");
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            loading={busy}
            leftIcon={<Trash2 className="h-4 w-4" />}
            className="bg-transparent border border-border-error text-foreground-error shadow-none hover:bg-background-error hover:shadow-none focus-visible:ring-border-error"
          >
            {confirmLabel}
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

        <div className="flex items-start gap-2.5 rounded-regular border border-border-error/40 bg-background-error px-3.5 py-3">
          <ShieldAlert
            className="mt-0.5 h-4 w-4 shrink-0 text-foreground-error"
            aria-hidden
          />
          <p className="text-[13px] leading-relaxed text-foreground-error">
            Esta ação não pode ser desfeita. Por segurança, confirme com a sua
            senha — a exclusão fica registrada no histórico
            {operatorName ? (
              <>
                {" "}em nome de{" "}
                <strong className="font-semibold">{operatorName}</strong>
              </>
            ) : null}
            .
          </p>
        </div>

        <Input
          label="Sua senha"
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="off"
          hint={
            operatorName === "Master"
              ? "Sessão master: use a senha padrão do administrador."
              : "A senha da sua conta de administrador."
          }
        />
      </div>
    </Modal>
  );
}
