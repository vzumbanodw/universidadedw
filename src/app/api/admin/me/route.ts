import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-users.server";

/** Identidade do operador logado (para o topbar e diálogos do backoffice). */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    name: session.name,
    email: session.email,
    master: session.id === "master",
  });
}
