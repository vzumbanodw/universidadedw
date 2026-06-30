import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/ssr-server";
import { markLessonCompleted } from "@/lib/content/progress.server";
import { readContent } from "@/lib/content/store.server";

/**
 * Marca uma aula (vídeo) como concluída para o ALUNO logado. Chamado pelo
 * player quando o vídeo chega ao fim. Idempotente.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { lessonId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const lessonId = (body.lessonId ?? "").trim();
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId ausente." }, { status: 400 });
  }

  const content = await readContent();
  const lesson = content.lessons.find((l) => l.id === lessonId && l.published);
  if (!lesson) {
    return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 });
  }

  try {
    await markLessonCompleted(user.id, lesson.id, lesson.courseId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Falha ao salvar progresso." },
      { status: 500 },
    );
  }
}
