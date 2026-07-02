import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  listPasswordResetRequests,
  reviewPasswordResetRequest,
} from "@/lib/content/password-resets.server";

/**
 * Gestão das solicitações de redefinição de senha pelo OPERADOR (backoffice).
 *
 * GET  → lista todas as solicitações.
 * POST → { id, action: "approve" | "reject" } revisa uma solicitação pendente.
 *        Aprovada, o aluno define a nova senha na tela de primeiro acesso —
 *        o usuário do Auth é preservado, então o progresso não se perde.
 */

async function isOperator(): Promise<boolean> {
  const session = (await cookies()).get("admin_session")?.value;
  return session === "ok";
}

export async function GET() {
  if (!(await isOperator())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const requests = await listPasswordResetRequests();
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  if (!(await isOperator())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { id?: string; action?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  const action = body.action === "approve" || body.action === "reject" ? body.action : null;
  if (!id || !action) {
    return NextResponse.json({ error: "id/action inválidos." }, { status: 400 });
  }

  try {
    const updated = await reviewPasswordResetRequest(id, action);
    if (!updated) {
      return NextResponse.json(
        { error: "Solicitação não encontrada ou já revisada." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Falha ao revisar." },
      { status: 500 },
    );
  }
}
