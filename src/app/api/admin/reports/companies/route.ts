import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-users.server";
import { buildCompanyReports } from "@/lib/admin/company-reports.server";

/** Relatório por empresa (backoffice): métricas reais de uso da plataforma. */
export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await buildCompanyReports());
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Falha ao montar o relatório." },
      { status: 500 },
    );
  }
}
