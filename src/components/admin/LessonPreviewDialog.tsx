"use client";

import { Clock, FileVideo, VideoOff } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { YouTubePlayer } from "@/components/courses/YouTubePlayer";
import { getVideoEmbed } from "@/lib/video";
import { formatMinutes } from "@/lib/formatters";
import type { AdminLesson } from "@/types/admin";

type Props = {
  open: boolean;
  onClose: () => void;
  lesson: AdminLesson | null;
  courseTitle?: string;
};

/**
 * Pré-visualização da AULA dentro do backoffice: o operador assiste ao vídeo
 * publicado sem sair da sessão de administrador e sem precisar de conta de
 * aluno.
 *
 * Usa o mesmo player do app do aluno, mas **sem callbacks de progresso** — a
 * conferência de um operador nunca vira progresso/conclusão nos relatórios.
 */
export function LessonPreviewDialog({ open, onClose, lesson, courseTitle }: Props) {
  if (!lesson) return null;

  const embed = getVideoEmbed(lesson.videoUrl);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={lesson.title}
      description={
        courseTitle
          ? `${courseTitle} · pré-visualização (não conta como progresso)`
          : "Pré-visualização — não conta como progresso"
      }
      footer={<Button onClick={onClose}>Fechar</Button>}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral" size="sm" icon={<Clock className="h-3 w-3" />}>
            {formatMinutes(lesson.durationMinutes)}
          </Badge>
          {!lesson.published ? (
            <Badge variant="orange" size="sm">
              Rascunho
            </Badge>
          ) : null}
        </div>

        {/* Vídeo */}
        {embed ? (
          <div className="overflow-hidden rounded-medium border border-border-subtle bg-black">
            {/* O player se posiciona com `absolute inset-0` — precisa deste
                container com proporção definida, igual ao app do aluno. */}
            <div className="relative aspect-video w-full bg-black">
              {embed.kind === "youtube" ? (
                <YouTubePlayer key={embed.id} id={embed.id} title={lesson.title} />
              ) : embed.kind === "iframe" ? (
                <iframe
                  key={embed.src}
                  src={embed.src}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              ) : (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  key={embed.src}
                  src={embed.src}
                  controls
                  className="absolute inset-0 h-full w-full"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-medium border border-dashed border-border-default bg-background-subtle/50 px-6 py-12 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background-subtle text-foreground-muted">
              {lesson.videoUrl ? (
                <FileVideo className="h-5 w-5" aria-hidden />
              ) : (
                <VideoOff className="h-5 w-5" aria-hidden />
              )}
            </span>
            <p className="text-[14px] font-medium text-foreground-heading">
              {lesson.videoUrl
                ? "Não foi possível reconhecer o vídeo"
                : "Esta aula ainda não tem vídeo"}
            </p>
            <p className="max-w-[46ch] text-[13px] leading-relaxed text-foreground-muted">
              {lesson.videoUrl
                ? "A URL cadastrada não é do YouTube, Vimeo nem um arquivo de vídeo — o aluno também não conseguiria assistir."
                : "Edite a aula e informe a URL do vídeo para que o aluno possa assistir."}
            </p>
            {lesson.videoUrl ? (
              <code className="mt-1 max-w-full break-all rounded-small bg-background-elevated px-2.5 py-1.5 font-mono text-[11.5px] text-foreground-muted">
                {lesson.videoUrl}
              </code>
            ) : null}
          </div>
        )}

        {/* Conteúdo escrito da aula, como o aluno vê */}
        {lesson.description ? (
          <p className="text-[14px] leading-relaxed text-foreground-subtitle">
            {lesson.description}
          </p>
        ) : null}

        {lesson.contentBlocks.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-medium border border-border-subtle bg-background-subtle/40 px-4 py-3.5">
            <h3 className="text-[13px] font-semibold text-foreground-heading">
              {lesson.contentTitle || "Conteúdo da aula"}
            </h3>
            {lesson.contentBlocks.map((block, i) => (
              <p key={i} className="text-[13.5px] leading-relaxed text-foreground-subtitle">
                {block}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
