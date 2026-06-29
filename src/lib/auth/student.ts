import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/ssr-server";
import { readContent } from "@/lib/content/store.server";

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
  if (!isSupabaseConfigured()) return null;

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
