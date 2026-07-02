import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  createSupabaseServiceClient,
  hasServiceRole,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { readContent, writeContent } from "@/lib/content/store.server";
import {
  consumeResetRequest,
  findApprovedResetRequest,
} from "@/lib/content/password-resets.server";
import type { CompanyMember } from "@/types/admin";

/**
 * Ativação de conta do ALUNO (autoatendimento na tela de primeiro acesso).
 *
 * - PRIMEIRO ACESSO: o e-mail existe em `members` (cadastrado pelo backoffice
 *   ou por solicitação aprovada) mas ainda não tem usuário no Supabase Auth →
 *   cria o usuário com a senha escolhida e vincula `authUserId` ao membro.
 *
 * - REDEFINIÇÃO APROVADA: o e-mail já tem usuário no Auth e existe uma
 *   solicitação de "Esqueci minha senha" APROVADA → atualiza a senha do
 *   usuário EXISTENTE (auth.admin.updateUserById). O id do usuário não muda,
 *   então TODO o progresso (lesson_completions, certificados…) é preservado.
 *
 * Tudo roda no servidor com a SERVICE ROLE.
 */

export type ActivateResult =
  | { ok: true; mode: "created" | "reset" }
  | {
      ok: false;
      code: "unavailable" | "not_found" | "suspended" | "already_active" | "error";
      message: string;
    };

function admin(): SupabaseClient["auth"]["admin"] {
  return (createSupabaseServiceClient() as unknown as SupabaseClient).auth.admin;
}

/** Localiza o usuário do Auth pelo membro (authUserId) ou varrendo por e-mail. */
async function findAuthUser(
  member: CompanyMember,
  email: string,
): Promise<User | null> {
  const api = admin();

  if (member.authUserId) {
    try {
      const { data } = await api.getUserById(member.authUserId);
      if (data?.user) return data.user;
    } catch {
      // id órfão (usuário removido) — cai para a busca por e-mail
    }
  }

  // Varredura paginada (plataforma corporativa: volume pequeno de contas).
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await api.listUsers({ page, perPage: 200 });
    if (error) break;
    const users = data?.users ?? [];
    const match = users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (match) return match;
    if (users.length < 200) break; // última página
  }
  return null;
}

/** Grava `authUserId` (e ativa) no registro do membro. */
async function linkMember(memberId: string, authUserId: string): Promise<void> {
  const state = await readContent();
  const member = state.members.find((m) => m.id === memberId);
  if (!member || (member.authUserId === authUserId && member.status === "active")) {
    return;
  }
  await writeContent({
    ...state,
    members: state.members.map((m) =>
      m.id === memberId ? { ...m, authUserId, status: "active" } : m,
    ),
  });
}

export async function activateStudentAccount(
  rawEmail: string,
  password: string,
): Promise<ActivateResult> {
  if (!isSupabaseConfigured() || !hasServiceRole()) {
    return {
      ok: false,
      code: "unavailable",
      message: "Serviço indisponível. Tente novamente mais tarde.",
    };
  }

  const email = rawEmail.trim().toLowerCase();
  const content = await readContent();
  const member = content.members.find((m) => m.email.toLowerCase() === email);

  if (!member) {
    return {
      ok: false,
      code: "not_found",
      message:
        "E-mail não encontrado. Verifique com a sua empresa ou solicite acesso na tela de login.",
    };
  }
  if (member.status === "suspended") {
    return {
      ok: false,
      code: "suspended",
      message: "Acesso suspenso. Fale com a sua empresa.",
    };
  }

  const existing = await findAuthUser(member, email);

  // ---- Redefinição aprovada: atualiza a senha do usuário EXISTENTE ----------
  if (existing) {
    const approved = await findApprovedResetRequest(email);
    if (!approved) {
      return {
        ok: false,
        code: "already_active",
        message:
          'Este e-mail já tem acesso. Se esqueceu a senha, use "Esqueci minha senha" na tela de login.',
      };
    }

    const { error } = await admin().updateUserById(existing.id, { password });
    if (error) {
      return { ok: false, code: "error", message: error.message };
    }
    await consumeResetRequest(approved.id);
    await linkMember(member.id, existing.id);
    return { ok: true, mode: "reset" };
  }

  // ---- Primeiro acesso: cria o usuário com a senha escolhida ----------------
  const { data, error } = await admin().createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: member.name,
      memberId: member.id,
      companyId: member.companyId,
    },
  });
  if (error || !data?.user) {
    return {
      ok: false,
      code: "error",
      message: error?.message ?? "Não foi possível criar o acesso.",
    };
  }

  await linkMember(member.id, data.user.id);
  return { ok: true, mode: "created" };
}
