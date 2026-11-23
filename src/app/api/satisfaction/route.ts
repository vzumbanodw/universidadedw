import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/lib/auth/student";
import { parseSurveyAnswers } from "@/lib/satisfaction/survey";
import { saveSurveyResponse } from "@/lib/satisfaction/survey.server";

/**
 * Envio da Pesquisa de Satisfação pelo ALUNO logado. A identidade (nome,
 * e-mail, empresa) vem da sessão no servidor — nunca do corpo da requisição.
 */
export async function POST(request: Request) {
  const student = await getCurrentStudent();
  if (!student) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = parseSurveyAnswers(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await saveSurveyResponse(student, parsed.answers);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Falha ao salvar a resposta." },
      { status: 500 },
    );
  }
}
