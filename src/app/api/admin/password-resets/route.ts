import { after, NextResponse } from "next/server";
import {
  listPasswordResetRequests,
  reviewPasswordResetRequest,
} from "@/lib/content/password-resets.server";
import { sendPasswordResetApprovedEmail } from "@/lib/email/mailer.server";
import { getAdminSession, logAdminAction } from "@/lib/auth/admin-users.server";

/**
 * Gestão das solicitações de redefinição de senha pelo OPERADOR (backoffice).
 *
 * GET  → lista todas as solicitações.
 * POST → { id, action: "approve" | "reject" } revisa uma solicitação pendente.
 *        Aprovada, o aluno recebe por e-mail o link pessoal para definir a
 *        nova senha — o usuário do Auth é preservado, o progresso não se perde.
 */

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const requests = await listPasswordResetRequests();
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
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
    if (action === "approve") {
      // Link pessoal de redefinição por e-mail, depois da resposta.
      const { email, activationToken } = updated;
      after(() => sendPasswordResetApprovedEmail({ email, activationToken }));
    }
    const verb = action === "approve" ? "Aprovou" : "Recusou";
    after(() =>
      logAdminAction(session, `${verb} a redefinição de senha de ${updated.email}`),
    );
    // O token de ativação só circula no e-mail do aluno — nunca no browser.
    return NextResponse.json({
      ok: true,
      request: { ...updated, activationToken: undefined },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Falha ao revisar." },
      { status: 500 },
    );
  }
}
