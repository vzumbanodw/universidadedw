import { NextResponse } from "next/server";
import { createPasswordResetRequest } from "@/lib/content/password-resets.server";
import { readContent } from "@/lib/content/store.server";

/**
 * "Esqueci minha senha" (endpoint PÚBLICO da tela de login): registra uma
 * solicitação de redefinição para aprovação do operador no backoffice.
 *
 * A resposta é sempre genérica (não revela se o e-mail existe); a solicitação
 * só é criada de fato quando o e-mail pertence a um aluno cadastrado.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  try {
    const content = await readContent();
    const member = content.members.find((m) => m.email.toLowerCase() === email);
    if (member && member.status !== "suspended") {
      await createPasswordResetRequest(email);
    }
    // Genérico de propósito (não confirma nem nega o cadastro do e-mail).
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Erro ao registrar a solicitação." },
      { status: 500 },
    );
  }
}
