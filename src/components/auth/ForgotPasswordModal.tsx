"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "Esqueci minha senha": o aluno envia o e-mail e a solicitação vai para o
 * backoffice. Aprovada, ele define a nova senha na tela de primeiro acesso.
 */
export function ForgotPasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setError(null);
    setLoading(false);
    setSent(false);
  }, [open]);

  async function submit() {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError("Informe um e-mail válido.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não foi possível enviar. Tente novamente.");
        return;
      }
      setSent(true);
    } catch {
      setError("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Esqueci minha senha"
      description="Envie o seu e-mail e a equipe aprovará a redefinição. Depois da aprovação, defina a nova senha na tela de primeiro acesso."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          {!sent ? (
            <Button onClick={submit} loading={loading}>
              Enviar solicitação
            </Button>
          ) : null}
        </>
      }
    >
      {sent ? (
        <div className="flex items-start gap-3 rounded-regular border border-border-success/40 bg-background-success px-3.5 py-3">
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-foreground-success"
            aria-hidden
          />
          <p className="text-[13px] leading-relaxed text-foreground-success">
            Solicitação enviada. Assim que for aprovada, volte e use{" "}
            <strong className="font-semibold">Primeiro acesso</strong> para
            definir a sua nova senha — seu progresso continua salvo.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <FormError message={error} />
          <Input
            label="E-mail corporativo"
            type="email"
            placeholder="voce@empresa.com"
            autoComplete="email"
            inputMode="email"
            required
            startIcon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      )}
    </Modal>
  );
}
