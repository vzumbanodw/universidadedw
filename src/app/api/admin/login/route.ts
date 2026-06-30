import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Login do operador do backoffice. Protótipo: senha única via env
 * `ADMIN_PASSWORD` (default "dataweb"). Em produção, troque por um provedor de
 * identidade real (Auth.js, Clerk…) com papel de administrador.
 */
const PASSWORD = process.env.ADMIN_PASSWORD ?? "dataweb";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };

  if (!password || password !== PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  (await cookies()).set("admin_session", "ok", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ ok: true });
}
