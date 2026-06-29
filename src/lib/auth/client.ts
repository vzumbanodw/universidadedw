import type { AuthErrorCode } from "@/types/auth";

/**
 * Camada de autenticação do aluno no client. Conversa com as rotas
 * `/api/auth/*` (Supabase Auth no servidor). Mantém a mesma forma de retorno do
 * antigo mock, então a UI não precisa mudar de contrato.
 */

type LoginResult = { ok: true } | { ok: false; error: AuthErrorCode };

export async function loginWithEmailAndPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) return { ok: true };
    if (res.status === 503) return { ok: false, error: "unknown" };
    return { ok: false, error: "invalid_credentials" };
  } catch {
    return { ok: false, error: "unknown" };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    /* ignora: a navegação para /login segue mesmo assim */
  }
}
