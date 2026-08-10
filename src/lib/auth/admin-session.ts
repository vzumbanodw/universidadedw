/**
 * Sessão do OPERADOR do backoffice: token assinado (HMAC-SHA256) guardado no
 * cookie `admin_session`. Substitui o antigo valor fixo "ok" (forjável) e
 * carrega a identidade de quem operou — base do histórico nominal.
 *
 * Usa Web Crypto (crypto.subtle), então funciona tanto nas rotas Node quanto
 * no middleware (edge). Formato: `v1.<payload base64url>.<assinatura>`.
 */

export type AdminSession = {
  /** Id em `admin_users`, ou "master" para a senha ADMIN_PASSWORD. */
  id: string;
  name: string;
  email: string;
  /** Expiração (epoch ms). */
  exp: number;
};

export const ADMIN_COOKIE = "admin_session";
export const SESSION_HOURS = 8;

function secret(): string {
  // Dedicado se existir; senão deriva da senha master (com "pepper" fixo).
  return (
    process.env.ADMIN_SESSION_SECRET ||
    `udw-admin-v1:${process.env.ADMIN_PASSWORD ?? "dataweb"}`
  );
}

const enc = new TextEncoder();

function toB64url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(value: string): Uint8Array {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return toB64url(new Uint8Array(sig));
}

export async function signAdminSession(
  identity: Pick<AdminSession, "id" | "name" | "email">,
): Promise<string> {
  const session: AdminSession = {
    ...identity,
    exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000,
  };
  const payload = toB64url(enc.encode(JSON.stringify(session)));
  return `v1.${payload}.${await hmac(payload)}`;
}

/** Valida assinatura e expiração; null se inválido/expirado/legado ("ok"). */
export async function verifyAdminSession(
  token: string | undefined,
): Promise<AdminSession | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  const [, payload, sig] = parts;
  if (!payload || !sig) return null;

  const expected = await hmac(payload);
  if (sig.length !== expected.length) return null;
  // Comparação em tempo constante.
  let diff = 0;
  for (let i = 0; i < sig.length; i += 1) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;

  try {
    const session = JSON.parse(
      new TextDecoder().decode(fromB64url(payload)),
    ) as AdminSession;
    if (!session.id || typeof session.exp !== "number") return null;
    if (session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}
