import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/ssr-server";
import { readContent } from "@/lib/content/store.server";
import { DEV_SESSION_COOKIE, isDevLoginEnabled } from "@/lib/auth/dev-session";

/**
 * Identidade do aluno logado (server-side). Resolve o usuário do Supabase Auth
 * e o casa com o registro de membro (no documento de conteúdo) por e-mail,
 * trazendo nome, cargo e empresa para a UI do dashboard.
 */

export type CurrentStudent = {
  id: string;
  name: string;
  firstName: string;
  email: string;
  role: string;
  companyName?: string;
};

export async function getCurrentStudent(): Promise<CurrentStudent | null> {
  if (!isSupabaseConfigured()) return getDevStudent();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const content = await readContent();
  const email = user.email.toLowerCase();
  const member = content.members.find((m) => m.email.toLowerCase() === email);
  const company = member
    ? content.companies.find((c) => c.id === member.companyId)
    : undefined;

  const metaName =
    typeof user.user_metadata?.name === "string"
      ? (user.user_metadata.name as string)
      : undefined;
  const name = member?.name ?? metaName ?? user.email;

  return {
    id: user.id,
    name,
    firstName: name.split(" ")[0] ?? name,
    email: user.email,
    role: member?.jobTitle || "Aluno",
    companyName: company?.name,
  };
}

/**
 * Aluno resolvido a partir do atalho de login de desenvolvimento (cookie). Casa
 * o e-mail com um membro do conteúdo, quando existir; senão devolve um perfil
 * genérico. Retorna null fora de dev ou sem sessão.
 */
async function getDevStudent(): Promise<CurrentStudent | null> {
  if (!isDevLoginEnabled()) return null;

  const email = (await cookies()).get(DEV_SESSION_COOKIE)?.value;
  if (!email) return null;

  const content = await readContent();
  const member = content.members.find(
    (m) => m.email.toLowerCase() === email.toLowerCase(),
  );
  const company = member
    ? content.companies.find((c) => c.id === member.companyId)
    : undefined;
  const name = member?.name ?? "Admin Dataweb";

  return {
    id: member?.id ?? "dev_admin",
    name,
    firstName: name.split(" ")[0] ?? name,
    email: member?.email ?? email,
    role: member?.jobTitle || "Administrador",
    companyName: company?.name,
  };
}
