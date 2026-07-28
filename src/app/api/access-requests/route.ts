import { after, NextResponse } from "next/server";
import { createAccessRequest } from "@/lib/content/store.server";
import { notifyBackofficeNewRequest } from "@/lib/email/mailer.server";
import { formatCnpj, isValidCnpj } from "@/lib/validators/cnpj";

/**
 * Endpoint PÚBLICO (tela de login): registra uma solicitação de acesso. Não
 * exige autenticação. A gravação é pontual na tabela `access_requests`.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { name?: string; email?: string; companyName?: string; cnpj?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const companyName = (body.companyName ?? "").trim();
  const cnpjInput = (body.cnpj ?? "").trim();

  if (!name || !companyName || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Preencha nome, empresa e um email válido." },
      { status: 400 },
    );
  }
  if (!isValidCnpj(cnpjInput)) {
    return NextResponse.json(
      { error: "Informe um CNPJ válido." },
      { status: 400 },
    );
  }
  const cnpj = formatCnpj(cnpjInput);

  try {
    const req = await createAccessRequest({ name, email, companyName, cnpj });
    // Aviso ao backoffice depois da resposta (não atrasa nem quebra o cadastro).
    after(() => notifyBackofficeNewRequest({ kind: "access", name, email, companyName, cnpj }));
    return NextResponse.json({ ok: true, id: req.id });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Erro ao registrar a solicitação." },
      { status: 500 },
    );
  }
}
