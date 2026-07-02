import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseServiceClient,
  hasServiceRole,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { PasswordResetRequest, PasswordResetStatus } from "@/types/admin";

/**
 * Solicitações de redefinição de senha ("Esqueci minha senha"), persistidas em
 * `password_reset_requests` (migration 0007). Fluxo:
 *
 *   1. Aluno envia o e-mail pela tela de login → linha `pending`.
 *   2. Operador aprova/recusa no backoffice → `approved` | `rejected`.
 *   3. Aprovada, o aluno define a nova senha no primeiro acesso → `used`.
 *
 * Acesso somente pelo servidor (SERVICE ROLE — RLS sem policy pública).
 */

function db(): SupabaseClient {
  return createSupabaseServiceClient() as unknown as SupabaseClient;
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /does not exist|schema cache|could not find the table/i.test(msg)
  );
}

const MIGRATION_HINT =
  "A tabela de redefinição de senha ainda não existe. Rode a migration 0007 no Supabase.";

function fromRow(r: Record<string, unknown>): PasswordResetRequest {
  return {
    id: String(r.id ?? ""),
    email: String(r.email ?? ""),
    status: (r.status as PasswordResetStatus) ?? "pending",
    createdAt: r.created_at ? String(r.created_at) : "",
    reviewedAt: r.reviewed_at ? String(r.reviewed_at) : undefined,
  };
}

function newRequestId(): string {
  return `prr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Lista todas as solicitações (backoffice). [] se tabela/Supabase ausentes. */
export async function listPasswordResetRequests(): Promise<PasswordResetRequest[]> {
  if (!isSupabaseConfigured() || !hasServiceRole()) return [];
  try {
    const { data, error } = await db()
      .from("password_reset_requests")
      .select("id, email, status, created_at, reviewed_at")
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map(fromRow);
  } catch {
    return [];
  }
}

/**
 * Registra uma solicitação pendente para o e-mail. Idempotente: se já houver
 * uma pendente/aprovada (não usada) para o mesmo e-mail, não duplica.
 */
export async function createPasswordResetRequest(email: string): Promise<void> {
  if (!isSupabaseConfigured() || !hasServiceRole()) {
    throw new Error("Redefinição indisponível: Supabase não configurado no servidor.");
  }
  const normalized = email.trim().toLowerCase();

  const existing = await db()
    .from("password_reset_requests")
    .select("id, status")
    .ilike("email", normalized)
    .in("status", ["pending", "approved"])
    .limit(1)
    .maybeSingle();

  if (existing.error && isMissingTable(existing.error)) {
    throw new Error(MIGRATION_HINT);
  }
  if (existing.data) return; // já há uma solicitação ativa

  const { error } = await db().from("password_reset_requests").insert({
    id: newRequestId(),
    email: normalized,
    status: "pending",
  });
  if (error) {
    if (isMissingTable(error)) throw new Error(MIGRATION_HINT);
    throw new Error(`Falha ao registrar solicitação: ${error.message}`);
  }
}

/** Aprova ou recusa uma solicitação pendente (backoffice). */
export async function reviewPasswordResetRequest(
  id: string,
  action: "approve" | "reject",
): Promise<PasswordResetRequest | null> {
  const status: PasswordResetStatus = action === "approve" ? "approved" : "rejected";
  const { data, error } = await db()
    .from("password_reset_requests")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("id, email, status, created_at, reviewed_at")
    .maybeSingle();
  if (error) {
    if (isMissingTable(error)) throw new Error(MIGRATION_HINT);
    throw new Error(`Falha ao revisar solicitação: ${error.message}`);
  }
  return data ? fromRow(data) : null;
}

/** Solicitação APROVADA (não usada) para o e-mail, se houver. */
export async function findApprovedResetRequest(
  email: string,
): Promise<PasswordResetRequest | null> {
  if (!isSupabaseConfigured() || !hasServiceRole()) return null;
  try {
    const { data, error } = await db()
      .from("password_reset_requests")
      .select("id, email, status, created_at, reviewed_at")
      .ilike("email", email.trim().toLowerCase())
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return fromRow(data);
  } catch {
    return null;
  }
}

/** Marca a solicitação como usada (senha redefinida com sucesso). */
export async function consumeResetRequest(id: string): Promise<void> {
  await db()
    .from("password_reset_requests")
    .update({ status: "used" })
    .eq("id", id);
}
