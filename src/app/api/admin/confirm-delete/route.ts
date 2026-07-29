import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Confirmação de EXCLUSÃO (aluno ou empresa) no backoffice: exige o nome de
 * quem está removendo e a senha do administrador (ADMIN_PASSWORD), validada
 * AQUI no servidor. Cada confirmação gera uma linha de auditoria nos logs do
 * servidor (visível nos logs da Vercel em produção).
 */

const PASSWORD = process.env.ADMIN_PASSWORD ?? "dataweb";

export async function POST(request: Request) {
  const session = (await cookies()).get("admin_session")?.value;
  if (session !== "ok") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { operatorName?: string; password?: string; target?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const operatorName = (body.operatorName ?? "").trim();
  const target = (body.target ?? "").trim();

  if (!operatorName) {
    return NextResponse.json({ error: "Informe o seu nome." }, { status: 400 });
  }
  if (body.password !== PASSWORD) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  console.warn(
    `[auditoria] EXCLUSÃO confirmada por "${operatorName}" — alvo: ${target || "(não informado)"} — em ${new Date().toISOString()}`,
  );

  return NextResponse.json({ ok: true });
}
