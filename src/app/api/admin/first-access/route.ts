import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  activateAdmin,
  findAdminByActivationToken,
  logAdminAction,
} from "@/lib/auth/admin-users.server";
import {
  ADMIN_COOKIE,
  SESSION_HOURS,
  signAdminSession,
} from "@/lib/auth/admin-session";

/**
 * Primeira senha do ADMINISTRADOR (endpoint público de /admin/primeiro-acesso):
 * o token do link pessoal identifica a conta convidada; a pessoa define a
 * própria senha, a conta é ativada e já entra logada no backoffice.
 */

const MIN_PASSWORD = 8;

export async function POST(request: Request) {
  let body: { token?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const password = body.password ?? "";

  if (password.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.` },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = await findAdminByActivationToken(token);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 503 });
  }
  if (!admin) {
    return NextResponse.json(
      { error: "Link inválido ou já utilizado. Peça um novo link ao responsável." },
      { status: 404 },
    );
  }

  const ok = await activateAdmin(admin.id, password);
  if (!ok) {
    return NextResponse.json(
      { error: "Não foi possível ativar a conta. Tente novamente." },
      { status: 500 },
    );
  }

  const identity = { id: admin.id, name: admin.name, email: admin.email };
  (await cookies()).set(ADMIN_COOKIE, await signAdminSession(identity), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * SESSION_HOURS,
  });

  await logAdminAction(
    { ...identity, exp: 0 },
    "Definiu a senha e ativou a própria conta de administrador",
  );

  return NextResponse.json({ ok: true, name: admin.name });
}
