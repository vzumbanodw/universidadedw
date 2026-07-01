import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/ssr-server";
import { saveLessonProgress } from "@/lib/content/progress.server";
import { readContent } from "@/lib/content/store.server";

/**
 * Salva o PROGRESSO (%) de uma aula para o ALUNO logado. Chamado pelo player a
 * cada ~5s de reprodução (e ao pausar). Mantém sempre a maior % assistida e
 * marca conclusão automaticamente ao atingir o limiar. Idempotente.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { lessonId?: string; percent?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const lessonId = (body.lessonId ?? "").trim();
  const percent = Number(body.percent);
  if (!lessonId || !Number.isFinite(percent)) {
    return NextResponse.json({ error: "lessonId/percent ausente." }, { status: 400 });
  }

  const content = await readContent();
  const lesson = content.lessons.find((l) => l.id === lessonId && l.published);
  if (!lesson) {
    return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 });
  }

  try {
    await saveLessonProgress(user.id, lesson.id, lesson.courseId, percent);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Falha ao salvar progresso." },
      { status: 500 },
    );
  }
}
