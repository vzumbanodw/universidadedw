import { readContent } from "@/lib/content/store.server";
import { listPasswordResetRequests } from "@/lib/content/password-resets.server";

/**
 * Resolve um token de ativação (link recebido por e-mail) para o e-mail do
 * solicitante. Válido somente enquanto a solicitação correspondente está
 * APROVADA:
 *
 *   - acesso: solicitação em `access_requests` com status "approved";
 *   - redefinição: solicitação em `password_reset_requests` "approved"
 *     (depois de usada ela vira "used" e o link expira sozinho).
 */

export type ResolvedActivation =
  | { kind: "access"; email: string; name: string }
  | { kind: "reset"; email: string };

const MIN_TOKEN_LENGTH = 24;

export async function resolveActivationToken(
  raw: string | undefined,
): Promise<ResolvedActivation | null> {
  const token = (raw ?? "").trim();
  // Curto demais nunca é um token gerado por nós — e evita casar com
  // registros antigos sem token (undefined === undefined).
  if (token.length < MIN_TOKEN_LENGTH) return null;

  const state = await readContent();
  const access = state.accessRequests.find(
    (r) => r.activationToken === token && r.status === "approved",
  );
  if (access) {
    return { kind: "access", email: access.email.toLowerCase(), name: access.name };
  }

  const resets = await listPasswordResetRequests();
  const reset = resets.find(
    (r) => r.activationToken === token && r.status === "approved",
  );
  if (reset) return { kind: "reset", email: reset.email.toLowerCase() };

  return null;
}
