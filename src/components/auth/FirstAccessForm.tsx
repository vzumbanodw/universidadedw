"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { PasswordField } from "./PasswordField";

const MIN_PASSWORD = 8;

type Props = {
  /** Token do link pessoal recebido por e-mail. */
  token: string;
  /** E-mail resolvido pelo token (somente exibição — o servidor não confia nele). */
  email: string;
  /** true = redefinição aprovada; false = primeiro acesso. */
  isReset?: boolean;
};

/**
 * Formulário de criação de senha, aberto pelo link pessoal do e-mail de
 * aprovação. O e-mail vem travado (identificado pelo token); a pessoa só
 * escolhe a senha. Em caso de sucesso já entra no dashboard.
 */
export function FirstAccessForm({ token, email, isReset = false }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/first-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        signedIn?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não foi possível concluir. Tente novamente.");
        return;
      }

      if (data.signedIn) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        router.replace("/login");
      }
    } catch {
      setError("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormError message={error} />

      <Input
        label="Seu e-mail"
        type="email"
        value={email}
        readOnly
        disabled
        startIcon={<Mail className="h-4 w-4" />}
      />

      <PasswordField
        label={isReset ? "Nova senha" : "Crie sua senha"}
        placeholder="Mínimo de 8 caracteres"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <PasswordField
        label="Confirme a senha"
        placeholder="Repita a senha"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      <Button type="submit" size="lg" fullWidth loading={loading}>
        {isReset ? "Redefinir senha e entrar" : "Definir senha e entrar"}
      </Button>
    </form>
  );
}
