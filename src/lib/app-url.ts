/**
 * URL pública do app, usada para montar links enviados por e-mail e exibidos
 * no backoffice (criação de senha, backoffice etc.).
 *
 * Ordem: APP_URL (configurada) → domínio de produção da Vercel → URL do deploy.
 * O fallback da Vercel evita links quebrados caso APP_URL não esteja definida.
 * Retorna "" quando nada está disponível (dev local sem configuração).
 */
export function appUrl(): string {
  const explicit = (process.env.APP_URL ?? "").trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel =
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "").trim() ||
    (process.env.VERCEL_URL ?? "").trim();
  if (vercel) {
    return vercel.startsWith("http") ? vercel.replace(/\/$/, "") : `https://${vercel}`;
  }
  return "";
}

/** Link de criação/redefinição de senha do aluno para um token de ativação. */
export function studentPasswordLink(token: string): string {
  const base = appUrl();
  return base ? `${base}/primeiro-acesso?token=${token}` : "";
}
