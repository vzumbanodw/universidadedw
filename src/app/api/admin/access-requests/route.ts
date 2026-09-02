import { after, NextResponse } from "next/server";
import { reviewAccessRequest } from "@/lib/content/store.server";
import { sendAccessApprovedEmail } from "@/lib/email/mailer.server";
import { getAdminSession, logAdminAction } from "@/lib/auth/admin-users.server";
import { studentPasswordLink } from "@/lib/app-url";

/**
 * Endpoint do OPERADOR (cookie `admin_session`): aprova ou recusa uma
 * solicitação de acesso. A aprovação grava a empresa vinculada; a criação do
 * funcionário em si é feita no cliente (store), pelo fluxo normal de membros.
 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { id?: string; action?: "approve" | "reject"; companyId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const { id, action, companyId } = body;
  if (!id || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }
  if (action === "approve" && !companyId) {
    return NextResponse.json(
      { error: "Selecione uma empresa para aprovar." },
      { status: 400 },
    );
  }

  try {
    const updated = await reviewAccessRequest(
      id,
      action === "approve" ? "approved" : "rejected",
      companyId,
    );
    if (action === "approve" && updated) {
      // Confirmação com o link pessoal de criação de senha, depois da resposta.
      const { name, email, activationToken } = updated;
      after(() => sendAccessApprovedEmail({ name, email, activationToken }));
    }
    if (updated) {
      const verb = action === "approve" ? "Aprovou" : "Recusou";
      after(() =>
        logAdminAction(
          session,
          `${verb} a solicitação de acesso de "${updated.name}" (${updated.email})`,
        ),
      );
    }
    // O token não vai no objeto da solicitação (não é persistido no browser),
    // mas o LINK é devolvido ao operador: quando o e-mail não chega, ele
    // entrega o link direto ao aluno (WhatsApp, e-mail próprio etc.).
    const activationLink =
      action === "approve" && updated?.activationToken
        ? studentPasswordLink(updated.activationToken)
        : null;
    return NextResponse.json({
      ok: true,
      request: updated ? { ...updated, activationToken: undefined } : updated,
      activationLink,
      activationToken: action === "approve" ? (updated?.activationToken ?? null) : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Erro ao processar a solicitação." },
      { status: 500 },
    );
  }
}
