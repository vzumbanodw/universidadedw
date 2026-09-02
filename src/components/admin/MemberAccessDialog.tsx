"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, Link2, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminStore } from "@/lib/admin/store";
import type { CompanyMember } from "@/types/admin";

type MemberAccessDialogProps = {
  open: boolean;
  onClose: () => void;
  member: CompanyMember | null;
};

type Credentials = { email: string; password: string };

/**
 * Libera o acesso do aluno pelo backoffice, de duas formas:
 *
 *  1. LINK DE SENHA (recomendado): gera um link pessoal para o aluno criar a
 *     própria senha. O operador envia pelo próprio sistema (botão "Enviar por
 *     e-mail") ou entrega por WhatsApp copiando o link.
 *  2. SENHA AUTOMÁTICA: cria a conta com uma senha gerada, para o operador
 *     repassar. Também serve para redefinir a senha de quem já tem conta.
 */
export function MemberAccessDialog({ open, onClose, member }: MemberAccessDialogProps) {
  const store = useAdminStore();
  const [loading, setLoading] = useState<"password" | "link" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [accessLink, setAccessLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Envio do link por e-mail para o próprio aluno.
  const [sendingMail, setSendingMail] = useState(false);
  const [mailResult, setMailResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(null);
    setError(null);
    setCredentials(null);
    setAccessLink(null);
    setCopied(false);
    setMailResult(null);
    setSendingMail(false);
  }, [open, member]);

  if (!member) return null;

  const hasAccount = Boolean(member.authUserId);
  const hasResult = Boolean(credentials || accessLink);

  async function submit(reset: boolean) {
    if (!member) return;
    setLoading("password");
    setError(null);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          reset
            ? { userId: member.authUserId, email: member.email }
            : {
                email: member.email,
                name: member.name,
                memberId: member.id,
                companyId: member.companyId,
              },
        ),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        email?: string;
        password?: string;
        userId?: string;
      };

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não foi possível concluir a operação.");
        return;
      }

      setCredentials({ email: data.email ?? member.email, password: data.password ?? "" });

      // Reflete no registro do membro: conta ativa + id do usuário Auth.
      store.upsertMember({
        ...member,
        authUserId: data.userId ?? member.authUserId,
        status: "active",
      });
    } catch {
      setError("Falha de rede. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  /** Gera o link pessoal para o próprio aluno definir a senha. */
  async function generateLink() {
    if (!member) return;
    setLoading("link");
    setError(null);
    try {
      const res = await fetch("/api/admin/members/access-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: member.email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; link?: string; token?: string };
      if (!res.ok || !data.ok || !data.token) {
        setError(data.error ?? "Não foi possível gerar o link.");
        return;
      }
      // Usa o link do servidor; sem APP_URL configurada, monta com a origem atual.
      setAccessLink(data.link || `${siteOrigin()}/primeiro-acesso?token=${data.token}`);
    } catch {
      setError("Falha de rede. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  /**
   * Envia o link por e-mail ao próprio aluno. Gera um link novo no servidor
   * (o anterior é invalidado), então a tela passa a exibir exatamente o que
   * foi enviado.
   */
  async function sendByEmail() {
    if (!member) return;
    setSendingMail(true);
    setMailResult(null);
    try {
      const res = await fetch("/api/admin/members/access-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: member.email, name: member.name, send: true }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        link?: string;
        token?: string;
        sent?: boolean;
        sendError?: string;
      };
      if (!res.ok || !data.ok || !data.token) {
        setMailResult({ ok: false, message: data.error ?? "Não foi possível enviar." });
        return;
      }
      setAccessLink(data.link || `${siteOrigin()}/primeiro-acesso?token=${data.token}`);
      setMailResult(
        data.sent
          ? { ok: true, message: `Link enviado para ${member.email}. Peça para conferir também o spam.` }
          : { ok: false, message: data.sendError ?? "O e-mail não pôde ser enviado — copie o link e envie por outro canal." },
      );
    } catch {
      setMailResult({ ok: false, message: "Falha de rede. Tente novamente." });
    } finally {
      setSendingMail(false);
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

  const linkMessage = accessLink
    ? `Olá, ${member.name}! Seu acesso à Universidade Dataweb está liberado. ` +
      `Crie a sua senha por este link: ${accessLink}`
    : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Acesso do aluno"
      description="Libere o acesso enviando um link para o aluno criar a própria senha, ou gere uma senha automática para entregar a ele."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          {!hasResult ? (
            <>
              <Button
                variant="outline"
                onClick={() => submit(hasAccount)}
                loading={loading === "password"}
                disabled={loading !== null}
                leftIcon={
                  hasAccount ? (
                    <RefreshCw className="h-4 w-4" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )
                }
              >
                {hasAccount ? "Gerar nova senha" : "Criar com senha automática"}
              </Button>
              <Button
                onClick={generateLink}
                loading={loading === "link"}
                disabled={loading !== null}
                leftIcon={<Link2 className="h-4 w-4" />}
              >
                Gerar link de senha
              </Button>
            </>
          ) : null}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-regular border border-border-subtle bg-background-subtle/50 px-3.5 py-3">
          <ShieldCheck className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold text-foreground-heading">
              {member.name}
            </p>
            <p className="truncate text-[12.5px] text-foreground-muted">{member.email}</p>
          </div>
          {hasAccount ? (
            <Badge variant="success" size="sm" dot className="ml-auto">
              Conta ativa
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm" className="ml-auto">
              Sem acesso
            </Badge>
          )}
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-regular border border-border-error bg-background-error px-3.5 py-2.5 text-sm text-foreground-error"
          >
            {error}
          </p>
        ) : null}

        {accessLink ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-regular border border-border-success/40 bg-background-success px-3.5 py-3">
              <p className="text-[12.5px] font-medium text-foreground-success">
                Link gerado. Envie para {member.name} — ao abrir, a pessoa cria a
                própria senha e já entra na plataforma.
              </p>
              <p className="mt-2 break-all rounded-small bg-background-elevated px-2.5 py-2 font-mono text-[12px] text-foreground-heading">
                {accessLink}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={sendByEmail}
                loading={sendingMail}
                leftIcon={<Mail className="h-4 w-4" />}
              >
                Enviar por e-mail
              </Button>
              <Button
                variant="outline"
                onClick={() => copyText(accessLink)}
                leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              >
                {copied ? "Copiado" : "Copiar link"}
              </Button>
              <Button variant="ghost" onClick={() => copyText(linkMessage)}>
                Copiar mensagem pronta
              </Button>
            </div>

            {mailResult ? (
              <p
                role="alert"
                className={
                  mailResult.ok
                    ? "rounded-regular border border-border-success/40 bg-background-success px-3.5 py-2.5 text-[13px] text-foreground-success"
                    : "rounded-regular border border-border-error/60 bg-background-error px-3.5 py-2.5 text-[13px] text-foreground-error"
                }
              >
                {mailResult.message}
              </p>
            ) : null}
          </div>
        ) : credentials ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-regular border border-border-success/40 bg-background-success px-3.5 py-3">
              <p className="text-[12.5px] font-medium text-foreground-success">
                Acesso pronto. Copie e entregue ao aluno — a senha não será exibida de novo.
              </p>
              <dl className="mt-2.5 flex flex-col gap-1.5 text-[13px]">
                <CredentialRow label="Login" value={credentials.email} />
                <CredentialRow label="Senha" value={credentials.password} mono />
              </dl>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                copyText(
                  `Universidade Dataweb\nLogin: ${credentials.email}\nSenha: ${credentials.password}\nAcesse: ${siteOrigin()}/login`,
                )
              }
              leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? "Copiado" : "Copiar credenciais"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-foreground-muted">
            <p>
              <strong className="font-semibold text-foreground-heading">
                Gerar link de senha
              </strong>{" "}
              — o aluno abre o link e escolhe a própria senha. Depois de gerar,
              você pode enviá-lo por e-mail para a pessoa com um clique ou
              copiar e mandar por outro canal (WhatsApp, por exemplo).
            </p>
            <p>
              <strong className="font-semibold text-foreground-heading">
                {hasAccount ? "Gerar nova senha" : "Criar com senha automática"}
              </strong>{" "}
              — o sistema cria uma senha e você a repassa ao aluno.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function CredentialRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <dt className="w-12 shrink-0 text-[11px] font-medium uppercase tracking-[0.08em] text-foreground-success/80">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "font-mono text-[14px] font-semibold text-foreground-heading"
            : "text-[13.5px] text-foreground-heading"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function siteOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
