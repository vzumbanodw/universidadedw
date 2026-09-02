import { NextResponse } from "next/server";
import { getAdminSession, logAdminAction } from "@/lib/auth/admin-users.server";
import { emailStatus, sendTestEmail } from "@/lib/email/mailer.server";

/**
 * Diagnóstico de e-mail (backoffice → Configurações).
 *
 * GET  → como o envio está configurado no servidor (sem expor a senha).
 * POST → { to } dispara um e-mail de teste e informa o erro real, se houver.
 */
export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(emailStatus());
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { to?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const to = (body.to ?? "").trim() || session.email;
  if (!to) {
    return NextResponse.json(
      { error: "Informe o e-mail que deve receber o teste." },
      { status: 400 },
    );
  }

  const result = await sendTestEmail(to);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  await logAdminAction(session, `Enviou um e-mail de teste para ${to}`);
  return NextResponse.json({ ok: true, to });
}
