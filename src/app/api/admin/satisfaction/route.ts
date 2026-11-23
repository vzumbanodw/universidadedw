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
 * Remove a resposta de uma pessoa (ex.: respostas de teste do time). A pessoa
 * volta a ver a pesquisa na próxima entrada.
 */
export async function DELETE(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const studentId = new URL(request.url).searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "studentId obrigatório." }, { status: 400 });
  }
  try {
    await deleteSurveyResponse(studentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Falha ao remover a resposta." },
      { status: 500 },
    );
  }
}
