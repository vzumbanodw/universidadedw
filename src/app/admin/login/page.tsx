"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // "Esqueci minha senha": envia o link de senha do backoffice por e-mail.
  const [recovering, setRecovering] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "E-mail ou senha incorretos. Tente novamente.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecovery() {
    const mail = email.trim();
    if (!mail) {
      setError("Informe o seu e-mail para receber o link.");
      return;
    }
    setError(null);
    setRecoveryMessage(null);
    setRecovering(true);
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mail }),
      });
      const data = (await res.json()) as { ok?: boolean; sent?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar o link.");
        return;
      }
      setRecoveryMessage(
        data.sent
          ? `Se ${mail} for de um administrador, o link de senha chega em instantes. Confira também o spam.`
          : (data.error ??
              "O e-mail não pôde ser enviado. Peça o link ao responsável pelo sistema."),
      );
    } catch {
      setError("Falha de rede. Tente novamente.");
    } finally {
      setRecovering(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-dark px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-hero-glow" />

      <div className="relative w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <span
            aria-hidden
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-regular bg-gradient-to-br from-brand-primary to-brand-secondary shadow-elevation-md"
          >
            <GraduationCap className="h-6 w-6 text-white" />
          </span>
          <h1 className="text-[18px] font-semibold tracking-tight text-white">
            Backoffice · Universidade
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-white/55">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" aria-hidden />
            Acesso restrito ao operador
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-large border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
        >
          {error ? <FormError message={error} /> : null}

          <Input
            type="email"
            label="E-mail"
            placeholder="voce@dataweb.com.br"
            autoFocus
            autoComplete="email"
            startIcon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="[&_label]:text-white/70"
          />

          <Input
            type="password"
            label="Senha"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            startIcon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="[&_label]:text-white/70"
          />

          <Button type="submit" fullWidth loading={loading} disabled={!password}>
            Entrar no backoffice
          </Button>

          <button
            type="button"
            onClick={handleRecovery}
            disabled={recovering}
            className="text-center text-[12.5px] font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline disabled:opacity-60"
          >
            {recovering ? "Enviando link…" : "Esqueci minha senha"}
          </button>

          {recoveryMessage ? (
            <p
              role="status"
              className="rounded-regular border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white/80"
            >
              {recoveryMessage}
            </p>
          ) : null}
        </form>

        <p className="mt-5 text-center text-[12px] text-white/40">
          Esta área não é acessível aos clientes da plataforma.
        </p>
      </div>
    </main>
  );
}
