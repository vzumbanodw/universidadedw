import { NextResponse } from "next/server";
import {
  getAdminSession,
  logAdminAction,
  verifyAdminLogin,
} from "@/lib/auth/admin-users.server";

/**
 * Confirmação de EXCLUSÃO (aluno ou empresa) no backoffice: o operador LOGADO
 * confirma digitando a própria senha (validada no servidor) — sessão master
 * confirma com a ADMIN_PASSWORD. A exclusão fica no histórico nominal
 * (`admin_audit_log`) com quem removeu, o quê e quando.
 */

const MASTER_PASSWORD = process.env.ADMIN_PASSWORD ?? "dataweb";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { password?: string; target?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const password = body.password ?? "";
  const target = (body.target ?? "").trim();
  if (!password) {
    return NextResponse.json({ error: "Informe a sua senha." }, { status: 400 });
  }

  const valid =
    session.id === "master"
      ? password === MASTER_PASSWORD
      : Boolean(await verifyAdminLogin(session.email, password));

  if (!valid) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  await logAdminAction(session, `Excluiu ${target || "(alvo não informado)"}`);
  return NextResponse.json({ ok: true });
}
