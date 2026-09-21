import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  createSupabaseServiceClient,
  hasServiceRole,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  ADMIN_COOKIE,
  verifyAdminSession,
  type AdminSession,
} from "@/lib/auth/admin-session";
import { newActivationToken } from "@/lib/auth/activation-token";

/**
 * Contas individuais de ADMINISTRADOR do backoffice (`admin_users`, migração
 * 0009) + trilha de auditoria nominal (`admin_audit_log`).
 *
 * A senha é da própria pessoa (hash scrypt), definida pelo link de ativação.
 * A senha master (ADMIN_PASSWORD) segue como acesso de emergência ("Master").
 * Tudo acessado só pelo servidor (SERVICE ROLE — RLS sem policy pública).
 */

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  status: "invited" | "active";
};

function db(): SupabaseClient {
  return createSupabaseServiceClient() as unknown as SupabaseClient;
}

function available(): boolean {
  return isSupabaseConfigured() && hasServiceRole();
}

const MIGRATION_HINT =
  "As contas de administrador ainda não existem. Rode a migration 0009 no Supabase.";

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /does not exist|schema cache|could not find the table/i.test(msg)
  );
}

/* -------------------------------------------------------------------------- */
/* Hash de senha (scrypt, sem dependências novas)                              */
/* -------------------------------------------------------------------------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

/* -------------------------------------------------------------------------- */
/* Sessão atual (rotas do servidor)                                            */
/* -------------------------------------------------------------------------- */

/** Sessão do operador logado, ou null. Use nas rotas /api/admin/*. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifyAdminSession(token);
}

/* -------------------------------------------------------------------------- */
/* Contas                                                                      */
/* -------------------------------------------------------------------------- */

/** Login individual: e-mail + senha da própria conta (ativa). */
export async function verifyAdminLogin(
  email: string,
  password: string,
): Promise<AdminUser | null> {
  if (!available()) return null;
  const { data, error } = await db()
    .from("admin_users")
    .select("id, name, email, status, password_hash")
    .ilike("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error || !data?.password_hash) return null;
  if (data.status !== "active") return null;
  if (!verifyPassword(password, String(data.password_hash))) return null;
  return { id: data.id, name: data.name, email: data.email, status: data.status };
}

/**
 * Conta pelo token do link pessoal. Vale tanto para a PRIMEIRA senha quanto
 * para REDEFINIÇÃO — o token é a prova de posse do e-mail, então o status da
 * conta não restringe (uma conta ativa que esqueceu a senha também usa isto).
 */
export async function findAdminByActivationToken(
  token: string,
): Promise<AdminUser | null> {
  if (!available() || token.trim().length < 24) return null;
  const { data, error } = await db()
    .from("admin_users")
    .select("id, name, email, status")
    .eq("activation_token", token.trim())
    .maybeSingle();
  if (error) {
    if (isMissingTable(error)) throw new Error(MIGRATION_HINT);
    return null;
  }
  return data ? { id: data.id, name: data.name, email: data.email, status: data.status } : null;
}

/** Define (ou redefine) a senha da conta, ativa e invalida o token usado. */
export async function activateAdmin(
  id: string,
  password: string,
): Promise<boolean> {
  if (!available()) return false;
  const { error, data } = await db()
    .from("admin_users")
    .update({
      password_hash: hashPassword(password),
      status: "active",
      activation_token: null,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  return !error && Boolean(data);
}

/**
 * "Esqueci minha senha" do backoffice: gera um token novo para a conta do
 * e-mail informado (invalidando o anterior) e devolve os dados para o envio
 * do link. Retorna null quando não existe administrador com aquele e-mail.
 */
export async function createAdminPasswordToken(
  email: string,
): Promise<{ id: string; name: string; email: string; token: string } | null> {
  if (!available()) return null;
  const normalized = email.trim().toLowerCase();

  const { data, error } = await db()
    .from("admin_users")
    .select("id, name, email")
    .ilike("email", normalized)
    .maybeSingle();
  if (error || !data) return null;

  const token = newActivationToken();
  const update = await db()
    .from("admin_users")
    .update({ activation_token: token })
    .eq("id", data.id);
  if (update.error) return null;

  return { id: data.id, name: data.name, email: data.email, token };
}

/**
 * Estado da conta de administrador, para o login explicar o motivo real da
 * recusa ("conta sem senha definida" ≠ "senha incorreta"). Uso interno do
 * backoffice, com poucos operadores conhecidos.
 */
export async function getAdminAccountState(
  email: string,
): Promise<{ exists: boolean; needsPassword: boolean }> {
  if (!available()) return { exists: false, needsPassword: false };
  const { data, error } = await db()
    .from("admin_users")
    .select("status, password_hash")
    .ilike("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error || !data) return { exists: false, needsPassword: false };
  return {
    exists: true,
    needsPassword: !data.password_hash || data.status !== "active",
  };
}

/* -------------------------------------------------------------------------- */
/* Auditoria nominal                                                           */
/* -------------------------------------------------------------------------- */

export type AuditEntry = {
  id: number;
  adminName: string;
  adminEmail?: string;
  action: string;
  createdAt: string;
};

/** Grava uma ação no histórico. Nunca lança (auditoria não quebra fluxo). */
export async function logAdminAction(
  session: AdminSession | null,
  action: string,
): Promise<void> {
  const name = session?.name ?? "Desconhecido";
  const email = session?.email || null;
  if (!available()) {
    console.warn(`[auditoria] ${name}: ${action}`);
    return;
  }
  try {
    await db().from("admin_audit_log").insert({
      admin_name: name,
      admin_email: email,
      action,
    });
  } catch (error) {
    console.error("[auditoria] falha ao registrar:", error);
  }
}

/** Histórico (mais recentes primeiro). [] se tabela/Supabase ausentes. */
export async function listAuditLog(limit = 200): Promise<AuditEntry[]> {
  if (!available()) return [];
  const { data, error } = await db()
    .from("admin_audit_log")
    .select("id, admin_name, admin_email, action, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((r) => ({
    id: Number(r.id),
    adminName: String(r.admin_name ?? ""),
    adminEmail: r.admin_email ? String(r.admin_email) : undefined,
    action: String(r.action ?? ""),
    createdAt: String(r.created_at ?? ""),
  }));
}
