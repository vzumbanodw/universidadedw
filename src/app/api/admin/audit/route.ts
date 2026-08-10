import { NextResponse } from "next/server";
import {
  getAdminSession,
  listAuditLog,
  logAdminAction,
} from "@/lib/auth/admin-users.server";

/**
 * Histórico nominal do backoffice.
 *
 * GET  → lista as últimas ações (seção "Histórico").
 * POST → { action } registra uma ação em nome do operador LOGADO (chamado
 *        pelos diálogos do backoffice: cadastro/edição de empresas e
 *        funcionários, trocas de empresa etc.).
 */

const MAX_ACTION_LENGTH = 300;

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ entries: await listAuditLog() });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { action?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const action = (body.action ?? "").trim().slice(0, MAX_ACTION_LENGTH);
  if (!action) {
    return NextResponse.json({ error: "Ação vazia." }, { status: 400 });
  }

  await logAdminAction(session, action);
  return NextResponse.json({ ok: true });
}
