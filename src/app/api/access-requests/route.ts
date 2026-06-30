import { NextResponse } from "next/server";
import { createAccessRequest } from "@/lib/content/store.server";

/**
 * Endpoint PÚBLICO (tela de login): registra uma solicitação de acesso. Não
 * exige autenticação. A gravação é pontual na tabela `access_requests`.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { name?: string; email?: string; companyName?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const companyName = (body.companyName ?? "").trim();

  if (!name || !companyName || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Preencha nome, empresa e um email válido." },
      { status: 400 },
    );
  }

  try {
    const req = await createAccessRequest({ name, email, companyName });
    return NextResponse.json({ ok: true, id: req.id });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Erro ao registrar a solicitação." },
      { status: 500 },
    );
  }
}
