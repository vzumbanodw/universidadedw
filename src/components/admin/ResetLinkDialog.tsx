"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, Mail } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { PasswordResetRequest } from "@/types/admin";

type Props = {
  open: boolean;
  request: PasswordResetRequest | null;
  onClose: () => void;
};

/**
 * Reenvio do link de REDEFINIÇÃO DE SENHA de uma solicitação já aprovada
 * ("aguardando o aluno"): para quando a pessoa não recebeu o e-mail original.
 *
 * Usa o MESMO link da solicitação (não gera outro nem cria uma nova linha na
 * lista); se a solicitação for antiga e ainda não tiver link, um é gerado
 * nela na hora. O operador pode reenviar por e-mail ou copiar e mandar por
 * outro canal.
 */
export function ResetLinkDialog({ open, request, onClose }: Props) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Ao abrir, busca (ou gera) o link da própria solicitação — sem enviar nada.
  useEffect(() => {
    if (!open || !request) return;
    setLink(null);
    setError(null);
    setResult(null);
    setCopied(false);
    setSending(false);
    setLoading(true);

    let active = true;
    fetch("/api/admin/password-resets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: request.id, action: "resend" }),
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          link?: string;
          token?: string;
        };
        if (!active) return;
        if (!res.ok || !data.ok || !data.token) {
          setError(data.error ?? "Não foi possível obter o link.");
          return;
        }
        setLink(data.link || `${siteOrigin()}/primeiro-acesso?token=${data.token}`);
      })
      .catch(() => {
        if (active) setError("Falha de rede. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, request]);

  if (!request) return null;

  async function sendByEmail() {
    if (!request) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/password-resets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, action: "resend", send: true }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        sent?: boolean;
        sendError?: string;
      };
      if (!res.ok || !data.ok) {
        setResult({ ok: false, message: data.error ?? "Não foi possível enviar." });
        return;
      }
      setResult(
        data.sent
          ? {
              ok: true,
              message: `Link reenviado para ${request.email}. Peça para conferir também o spam.`,
            }
          : {
              ok: false,
              message:
                data.sendError ??
                "O e-mail não pôde ser enviado — copie o link e envie por outro canal.",
            },
      );
    } catch {
      setResult({ ok: false, message: "Falha de rede. Tente novamente." });
    } finally {
      setSending(false);
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

  const mensagem = link
    ? `Olá! Sua redefinição de senha na Universidade Dataweb foi aprovada. ` +
      `Defina a sua nova senha por este link: ${link}`
    : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Reenviar link de senha"
      description="Envie novamente o link para o aluno definir a nova senha. É o mesmo link aprovado — todo o progresso dele continua salvo."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          <Button
            onClick={sendByEmail}
            loading={sending}
            disabled={loading || !link}
            leftIcon={<Mail className="h-4 w-4" />}
          >
            Reenviar por e-mail
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-regular border border-border-subtle bg-background-subtle/50 px-3.5 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background-subtle text-foreground-muted">
            <KeyRound className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold text-foreground-heading">
              {request.email}
            </p>
            <p className="truncate text-[12.5px] text-foreground-muted">
              Redefinição aprovada — aguardando o aluno definir a senha
            </p>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-regular border border-border-error bg-background-error px-3.5 py-2.5 text-sm text-foreground-error"
          >
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-[13px] text-foreground-muted">Preparando o link…</p>
        ) : link ? (
          <>
            <div className="rounded-regular border border-border-subtle bg-background-subtle/40 px-3.5 py-3">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-foreground-muted">
                Link de definição de senha
              </p>
              <p className="mt-1.5 break-all rounded-small bg-background-elevated px-2.5 py-2 font-mono text-[12px] text-foreground-heading">
                {link}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => copyText(link)}
                leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              >
                {copied ? "Copiado" : "Copiar link"}
              </Button>
              <Button variant="ghost" onClick={() => copyText(mensagem)}>
                Copiar mensagem pronta
              </Button>
            </div>
          </>
        ) : null}

        {result ? (
          <p
            role="alert"
            className={
              result.ok
                ? "rounded-regular border border-border-success/40 bg-background-success px-3.5 py-2.5 text-[13px] text-foreground-success"
                : "rounded-regular border border-border-error/60 bg-background-error px-3.5 py-2.5 text-[13px] text-foreground-error"
            }
          >
            {result.message}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

function siteOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
