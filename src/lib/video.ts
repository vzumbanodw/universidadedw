/**
 * Normaliza uma URL de vídeo colada no backoffice para algo reproduzível no
 * app do aluno. Suporta YouTube (foco do produto), Vimeo e arquivos diretos
 * (mp4/webm…). Retorna `null` quando não há vídeo ou a URL não é reconhecida.
 */

export type VideoEmbed =
  | { kind: "iframe"; src: string } // YouTube/Vimeo (embed)
  | { kind: "file"; src: string }; // arquivo de vídeo direto

export function getVideoEmbed(url?: string | null): VideoEmbed | null {
  const u = (url ?? "").trim();
  if (!u) return null;

  const youtubeId = parseYouTubeId(u);
  if (youtubeId) {
    return { kind: "iframe", src: `https://www.youtube.com/embed/${youtubeId}` };
  }

  const vimeoId = parseVimeoId(u);
  if (vimeoId) {
    return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeoId}` };
  }

  // Já é uma URL de embed conhecida.
  if (/(?:youtube\.com\/embed\/|player\.vimeo\.com\/)/i.test(u)) {
    return { kind: "iframe", src: u };
  }

  // Arquivo de vídeo direto (ex.: Supabase Storage, CDN).
  if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(u)) {
    return { kind: "file", src: u };
  }

  return null;
}

/** Extrai o id de vídeo do YouTube de qualquer formato comum de URL. */
function parseYouTubeId(u: string): string | null {
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{6,})/,
    /[?&]v=([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{6,})/,
  ];
  for (const re of patterns) {
    const m = u.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

function parseVimeoId(u: string): string | null {
  const m = u.match(/vimeo\.com\/(?:video\/)?(\d{6,})/);
  return m?.[1] ?? null;
}
