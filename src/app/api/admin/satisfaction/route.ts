import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-users.server";
import {
  deleteSurveyResponse,
  listSurveyResponses,
} from "@/lib/satisfaction/survey.server";

/** Respostas da Pesquisa de Satisfação (backoffice). */
export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await listSurveyResponses());
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Falha ao carregar as respostas." },
      { status: 500 },
    );
  }
}

/**
 * Remove UMA resposta (ex.: respostas de teste do time). Se era a mais recente
 * da pessoa, a pesquisa volta a aparecer para ela na próxima entrada.
 */
export async function DELETE(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id obrigatório." }, { status: 400 });
  }
  try {
    await deleteSurveyResponse(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Falha ao remover a resposta." },
      { status: 500 },
    );
  }
}
