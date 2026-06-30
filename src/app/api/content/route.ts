import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readContent, writeContent } from "@/lib/content/store.server";
import type { AdminState } from "@/lib/admin/seed";

export const dynamic = "force-dynamic";

/** Leitura pública do conteúdo (usada pelo backoffice ao carregar). */
export async function GET() {
  const content = await readContent();
  return NextResponse.json(content);
}

/** Escrita: somente operador autenticado. Substitui o documento inteiro. */
export async function PUT(request: Request) {
  const session = (await cookies()).get("admin_session")?.value;
  if (session !== "ok") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as AdminState;
  const saved = await writeContent(body);
  return NextResponse.json(saved);
}
