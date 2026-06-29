import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { reviewAccessRequest } from "@/lib/content/store.server";

/**
 * Endpoint do OPERADOR (cookie `admin_session`): aprova ou recusa uma
 * solicitação de acesso. A aprovação grava a empresa vinculada; a criação do
 * funcionário em si é feita no cliente (store), pelo fluxo normal de membros.
 */
export async function POST(request: Request) {
  const session = (await cookies()).get("admin_session")?.value;
  if (session !== "ok") {
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
    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Erro ao processar a solicitação." },
      { status: 500 },
    );
  }
}
