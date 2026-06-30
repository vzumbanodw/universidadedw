"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImageIcon, Loader2, Upload, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaFieldProps = {
  label: string;
  hint?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  kind?: "image" | "video";
  /** `avatar` = preview pequeno e redondo; `default` = preview em banner. */
  variant?: "default" | "avatar";
  /** Proporção do preview de imagem. `portrait` = capa retrato (1280×1808). */
  aspect?: "landscape" | "portrait";
  /** Tamanho recomendado, exibido como dica (ex.: "1280 × 1808 px"). */
  recommendedSize?: string;
};

/**
 * Campo de mídia do backoffice.
 *
 * - Imagens (`kind="image"`): aceita uma URL OU envia o arquivo para o Supabase
 *   Storage (bucket `media`, via `/api/admin/media`) e grava a URL pública.
 * - Vídeo (`kind="video"`): apenas URL (cole o link do YouTube/Vimeo). O player
 *   do aluno faz o embed.
 */
export function MediaField({
  label,
  hint,
  value,
  onChange,
  kind = "image",
  variant = "default",
  aspect = "landscape",
  recommendedSize,
}: MediaFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const Icon = kind === "video" ? Video : ImageIcon;
  const hasValue = Boolean(value);
  const canUpload = kind === "image";
  const isPortrait = aspect === "portrait" && kind === "image";

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setUploadError(data.error ?? "Falha no upload.");
        return;
      }
      onChange(data.url);
    } catch {
      setUploadError("Falha de rede no upload.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const urlInput = (
    <div className="flex h-10 w-full min-w-0 items-center rounded-regular border border-border-default bg-background-elevated transition-colors focus-within:border-brand-primary focus-within:shadow-focus-ring">
      <input
        type="url"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder={
          kind === "video"
            ? "https://www.youtube.com/watch?v=…"
            : "https://cdn.dataweb.com/imagem.jpg"
        }
        className="h-full w-full min-w-0 flex-1 bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-foreground-placeholder outline-none"
      />
    </div>
  );

  const uploadButton = canUpload ? (
    <button
      type="button"
      onClick={() => fileRef.current?.click()}
      disabled={uploading}
      className="inline-flex h-9 w-fit shrink-0 items-center gap-2 rounded-regular border border-border-default bg-background-elevated px-3 text-[13px] font-medium text-foreground-subtitle transition-colors hover:bg-background-subtle hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
    >
      {uploading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : (
        <Upload className="h-3.5 w-3.5" aria-hidden />
      )}
      {uploading ? "Enviando…" : "Enviar imagem"}
    </button>
  ) : null;

  const fileInput = canUpload ? (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      onChange={onFile}
      className="hidden"
    />
  ) : null;

  function RemoveButton() {
    if (!hasValue) return null;
    return (
      <button
        type="button"
        onClick={() => onChange(undefined)}
        aria-label="Remover mídia"
        className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark/70 text-white transition-colors hover:bg-brand-dark"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    );
  }

  const errorNode = uploadError ? (
    <p role="alert" className="text-[12px] text-foreground-error">
      {uploadError}
    </p>
  ) : null;

  /* ----------------------------- Avatar ----------------------------------- */
  if (variant === "avatar") {
    return (
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground-subtitle">{label}</span>
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-default bg-background-subtle">
            {hasValue ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt={label} className="h-full w-full object-cover" />
            ) : (
              <Icon className="h-5 w-5 text-foreground-muted" aria-hidden />
            )}
            <RemoveButton />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {urlInput}
            {uploadButton}
          </div>
        </div>
        {errorNode}
        {hint ? <p className="text-[12px] text-foreground-muted">{hint}</p> : null}
        {fileInput}
      </div>
    );
  }

  /* ----------------------------- Banner ----------------------------------- */
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground-subtitle">{label}</span>

      <div
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden rounded-regular border border-border-default bg-background-subtle",
          isPortrait ? "aspect-[1280/1808] max-w-[200px]" : "aspect-[16/7]",
        )}
      >
        {hasValue && kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : hasValue && kind === "video" ? (
          <div className="flex flex-col items-center gap-1.5 px-4 text-center text-foreground-muted">
            <Video className="h-6 w-6 text-brand-primary" aria-hidden />
            <span className="line-clamp-2 break-all text-[11.5px]">{value}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-foreground-muted">
            <Icon className="h-6 w-6" aria-hidden />
            <span className="text-[12px]">
              {kind === "video" ? "Cole a URL do YouTube" : "Imagem · cole a URL ou envie"}
            </span>
          </div>
        )}
        <RemoveButton />
      </div>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        {urlInput}
        {uploadButton}
      </div>

      {errorNode}
      {recommendedSize ? (
        <p className="text-[12px] text-foreground-muted">
          Tamanho recomendado:{" "}
          <strong className="font-medium text-foreground-subtitle">
            {recommendedSize}
          </strong>
        </p>
      ) : null}
      {hint ? <p className="text-[12px] text-foreground-muted">{hint}</p> : null}
      {fileInput}
    </div>
  );
}
