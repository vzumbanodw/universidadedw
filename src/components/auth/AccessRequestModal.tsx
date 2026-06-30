"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Modal público (tela de login) para solicitar acesso à Universidade. Envia
 * nome, empresa (texto) e email para `/api/access-requests`. O operador aprova
 * ou recusa no backoffice (seção Solicitações).
 */
export function AccessRequestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setCompany("");
    setEmail("");
    setError(null);
    setSubmitting(false);
    setDone(false);
  }, [open]);

  async function handleSubmit() {
    const n = name.trim();
    const c = company.trim();
    const e = email.trim().toLowerCase();
    if (!n) {
      setError("Informe seu nome.");
      return;
    }
    if (!c) {
      setError("Informe o nome da sua empresa.");
      return;
    }
    if (!EMAIL_RE.test(e)) {
      setError("Informe um email válido.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, companyName: c, email: e }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não foi possível enviar a solicitação.");
        return;
      }
      setDone(true);
    } catch {
      setError("Falha de rede. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Solicitar acesso ao sistema"
      description={
        done
          ? undefined
          : "Preencha seus dados. A equipe Dataweb vai analisar e liberar seu acesso."
      }
      footer={
        done ? (
          <Button onClick={onClose}>Fechar</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={submitting} leftIcon={<Send className="h-4 w-4" />}>
              Enviar solicitação
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background-success text-foreground-success">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-foreground-heading">
              Solicitação enviada!
            </h3>
            <p className="mt-1 text-[13px] text-foreground-muted">
              Assim que for aprovada, você receberá o login e a senha de acesso.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {error ? (
            <p
              role="alert"
              className="rounded-regular border border-border-error bg-background-error px-3.5 py-2.5 text-sm text-foreground-error"
            >
              {error}
            </p>
          ) : null}
          <Input
            label="Seu nome"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Maria Silva"
          />
          <Input
            label="Empresa"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Óptica Boa Vista"
          />
          <Input
            label="Email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com.br"
          />
        </div>
      )}
    </Modal>
  );
}
