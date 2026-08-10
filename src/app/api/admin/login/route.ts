import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminLogin } from "@/lib/auth/admin-users.server";
import {
  ADMIN_COOKIE,
  SESSION_HOURS,
  signAdminSession,
} from "@/lib/auth/admin-session";

/**
 * Login do operador do backoffice (/admin/login):
 *
 * - INDIVIDUAL: e-mail + senha da própria conta (`admin_users`, migração
 *   0009). A identidade vai na sessão assinada e alimenta o histórico.
 * - MASTER: e-mail em branco + ADMIN_PASSWORD (acesso de emergência; as
 *   ações ficam registradas como "Master").
 */

const MASTER_PASSWORD = process.env.ADMIN_PASSWORD ?? "dataweb";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (!password) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let identity: { id: string; name: string; email: string } | null = null;
  const mail = (email ?? "").trim().toLowerCase();

  if (mail) {
    const admin = await verifyAdminLogin(mail, password);
    if (admin) identity = { id: admin.id, name: admin.name, email: admin.email };
  } else if (password === MASTER_PASSWORD) {
    identity = { id: "master", name: "Master", email: "" };
  }

  if (!identity) {
    return NextResponse.json(
      { ok: false, error: "E-mail ou senha incorretos." },
      { status: 401 },
    );
  }

  (await cookies()).set(ADMIN_COOKIE, await signAdminSession(identity), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * SESSION_HOURS,
  });

  return NextResponse.json({ ok: true, name: identity.name });
}
