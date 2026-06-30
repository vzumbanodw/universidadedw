import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServiceClient,
  hasServiceRole,
} from "@/lib/supabase/server";

/**
 * Upload de imagem para o Supabase Storage (bucket público `media`). Restrito ao
 * operador (cookie) e executado com a SERVICE ROLE no servidor. Retorna a URL
 * pública, que é o que o backoffice grava no campo de capa.
 *
 * Vídeo NÃO passa por aqui: o operador cola a URL do YouTube/Vimeo e o player
 * do aluno faz o embed.
 */

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const session = (await cookies()).get("admin_session")?.value;
  if (session !== "ok") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasServiceRole()) {
    return NextResponse.json(
      { error: "Storage indisponível: SUPABASE_SERVICE_ROLE_KEY ausente." },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Envie um arquivo de imagem (PNG, JPG, WEBP…)." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Imagem acima de 10MB. Reduza o tamanho." },
      { status: 400 },
    );
  }

  const ext =
    (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "png";
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `covers/${Date.now()}-${rand}.${ext}`;

  const supabase = createSupabaseServiceClient();
  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from("media")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
