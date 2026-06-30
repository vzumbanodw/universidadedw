"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Senha incorreta. Tente novamente.");
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
            type="password"
            label="Senha do operador"
            placeholder="••••••••"
            autoFocus
            required
            startIcon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="[&_label]:text-white/70"
          />

          <Button type="submit" fullWidth loading={loading} disabled={!password}>
            Entrar no backoffice
          </Button>
        </form>

        <p className="mt-5 text-center text-[12px] text-white/40">
          Esta área não é acessível aos clientes da plataforma.
        </p>
      </div>
    </main>
  );
}
