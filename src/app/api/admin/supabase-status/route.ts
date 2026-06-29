import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  hasServiceRole,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { readContent } from "@/lib/content/store.server";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico da conexão com o Supabase. Protegido pelo cookie de operador
 * para não vazar detalhes de infraestrutura. Útil para validar o setup:
 *   abra /api/admin/supabase-status após logar no backoffice.
 */
export async function GET() {
  const session = (await cookies()).get("admin_session")?.value;
  if (session !== "ok") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const configured = isSupabaseConfigured();
  const backend = configured ? "supabase" : "file";

  let connection: "ok" | "error" = "ok";
  let message: string | undefined;
  let counts: Record<string, number> = {};

  try {
    const content = await readContent();
    counts = {
      categories: content.categories.length,
      courses: content.courses.length,
      lessons: content.lessons.length,
      trails: content.trails.length,
      companies: content.companies.length,
      members: content.members.length,
      certificates: content.certificates.length,
      maturityLevels: content.maturityLevels.length,
      releaseNotes: content.releaseNotes.length,
    };
  } catch (error) {
    connection = "error";
    message = error instanceof Error ? error.message : "erro desconhecido";
  }

  return NextResponse.json({
    backend,
    configured,
    canWrite: hasServiceRole(),
    connection,
    message,
    counts,
  });
}
