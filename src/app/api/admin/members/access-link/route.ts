import { NextResponse } from "next/server";
import { getAdminSession, logAdminAction } from "@/lib/auth/admin-users.server";
import { createApprovedAccessLink } from "@/lib/content/password-resets.server";
import { studentPasswordLink } from "@/lib/app-url";

/**
 * Gera um LINK de definição de senha para um aluno (backoffice).
 *
 * Uso: o operador cadastra/atende o aluno e entrega o link por WhatsApp ou
 * pelo próprio e-mail — não depende da entrega automática do e-mail. Vale
 * para primeiro acesso e para redefinição (o progresso é preservado).
 *
 * Retorna `link` (quando a URL pública é conhecida) e sempre `token`, para o
 * cliente montar o link com a origem atual se necessário.
 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { email?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "E-mail obrigatório." }, { status: 400 });
  }

  try {
    const token = await createApprovedAccessLink(email);
    if (!token) {
      return NextResponse.json(
        { error: "Indisponível: Supabase não configurado no servidor." },
        { status: 503 },
      );
    }
    await logAdminAction(session, `Gerou link de definição de senha para ${email}`);
    return NextResponse.json({ ok: true, token, link: studentPasswordLink(token) });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Falha ao gerar o link." },
      { status: 500 },
    );
  }
}
