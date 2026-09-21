import { NextResponse } from "next/server";
import {
  createAdminPasswordToken,
  logAdminAction,
} from "@/lib/auth/admin-users.server";
import { sendAdminPasswordLinkEmail } from "@/lib/email/mailer.server";
import { appUrl } from "@/lib/app-url";

/**
 * "Esqueci minha senha" do BACKOFFICE (endpoint PÚBLICO de /admin/login).
 *
 * Gera um link pessoal para o administrador definir a senha e o envia por
 * e-mail. Serve tanto para quem nunca ativou a conta quanto para quem
 * esqueceu a senha — antes disso, a única saída era gerar o link no SQL
 * Editor do Supabase.
 *
 * A resposta é sempre genérica (não revela quem é administrador). Falha de
 * envio é reportada, para o operador saber que precisa de outro caminho.
 */
export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Informe o seu e-mail." }, { status: 400 });
  }

  const account = await createAdminPasswordToken(email);
  // Genérico de propósito: não confirma nem nega que o e-mail é de um admin.
  if (!account) {
    return NextResponse.json({ ok: true, sent: true });
  }

  const base = appUrl();
  if (!base) {
    return NextResponse.json(
      {
        ok: true,
        sent: false,
        error:
          "Endereço público do app não configurado (APP_URL) — não foi possível montar o link.",
      },
      { status: 200 },
    );
  }

  const link = `${base}/admin/primeiro-acesso?token=${account.token}`;
  const result = await sendAdminPasswordLinkEmail({
    name: account.name,
    email: account.email,
    link,
  });

  await logAdminAction(
    { id: account.id, name: account.name, email: account.email, exp: 0 },
    result.ok
      ? "Solicitou e recebeu por e-mail o link de senha do backoffice"
      : "Solicitou o link de senha do backoffice (falha no envio do e-mail)",
  );

  return NextResponse.json({ ok: true, sent: result.ok, error: result.error });
}
