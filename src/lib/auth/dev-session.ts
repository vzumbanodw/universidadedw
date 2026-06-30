import { isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Login de DESENVOLVIMENTO.
 *
 * Quando o Supabase não está configurado (protótipo rodando localmente), o login
 * do aluno por e-mail/senha não tem backend de autenticação. Para permitir testar
 * o dashboard no localhost, aceitamos uma credencial fixa (configurável por env)
 * e gravamos um cookie simples de sessão.
 *
 * NUNCA é habilitado em produção: exige `NODE_ENV !== "production"` E Supabase
 * ausente. Com o Supabase configurado, o fluxo real (Supabase Auth) é usado e
 * este atalho fica completamente fora do caminho.
 */

export const DEV_SESSION_COOKIE = "dev_student_session";

/**
 * O atalho só vale quando: (1) NÃO é produção, (2) NÃO há Supabase configurado
 * e (3) a credencial foi definida em variáveis de ambiente (`.env.local`).
 * Não há credencial embutida no código — sem as env vars, o atalho fica off.
 */
export function isDevLoginEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    !isSupabaseConfigured() &&
    Boolean(process.env.DEV_LOGIN_EMAIL) &&
    Boolean(process.env.DEV_LOGIN_PASSWORD)
  );
}

/** Credencial aceita pelo atalho — exclusivamente das env vars. */
export function getDevCredentials(): { email: string; password: string } {
  return {
    email: (process.env.DEV_LOGIN_EMAIL ?? "").trim().toLowerCase(),
    password: process.env.DEV_LOGIN_PASSWORD ?? "",
  };
}
