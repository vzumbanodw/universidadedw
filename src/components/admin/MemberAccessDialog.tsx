"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
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

export function MemberAccessDialog({ open, onClose, member }: MemberAccessDialogProps) {
  const store = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(false);
    setError(null);
    setCredentials(null);
    setCopied(false);
  }, [open, member]);

  if (!member) return null;

  const hasAccount = Boolean(member.authUserId);

  async function submit(reset: boolean) {
    if (!member) return;
    setLoading(true);
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
      setLoading(false);
    }
  }

  async function copyCredentials() {
    if (!credentials) return;
    const text = `Universidade Dataweb\nLogin: ${credentials.email}\nSenha: ${credentials.password}\nAcesse: ${siteOrigin()}/login`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard indisponível: o operador copia manualmente */
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Acesso do aluno"
      description="Crie o login da Universidade e entregue as credenciais ao usuário. Não há cadastro pelo app do aluno."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          {!credentials ? (
            hasAccount ? (
              <Button
                onClick={() => submit(true)}
                loading={loading}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Redefinir senha
              </Button>
            ) : (
              <Button
                onClick={() => submit(false)}
                loading={loading}
                leftIcon={<KeyRound className="h-4 w-4" />}
              >
                Criar acesso
              </Button>
            )
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

        {credentials ? (
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
              onClick={copyCredentials}
              leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? "Copiado" : "Copiar credenciais"}
            </Button>
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed text-foreground-muted">
            {hasAccount
              ? "Este aluno já possui acesso. Você pode gerar uma nova senha caso ele tenha esquecido a anterior."
              : "Ao criar o acesso, uma senha será gerada automaticamente. Você poderá copiá-la em seguida."}
          </p>
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
