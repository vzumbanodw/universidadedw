"use client";

import { useRef, type ChangeEvent } from "react";
import { ImageIcon, Upload, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaFieldProps = {
  label: string;
  hint?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  kind?: "image" | "video";
  /** `avatar` = preview pequeno e redondo; `default` = preview em banner. */
  variant?: "default" | "avatar";
};

/**
 * Campo de mídia do backoffice. Aceita uma URL (CDN/streaming) ou, como
 * conveniência de protótipo, o upload de um arquivo local convertido em data
 * URL para pré-visualização. Em produção, o upload enviaria para storage e
 * gravaria apenas a URL e o restante do formulário não muda.
 */
export function MediaField({
  label,
  hint,
  value,
  onChange,
  kind = "image",
  variant = "default",
}: MediaFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const Icon = kind === "video" ? Video : ImageIcon;
  const hasValue = Boolean(value);

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      onChange(typeof reader.result === "string" ? reader.result : undefined);
    reader.readAsDataURL(file);
  }

  const urlInput = (
    <div className="flex h-10 w-full min-w-0 items-center rounded-regular border border-border-default bg-background-elevated transition-colors focus-within:border-brand-primary focus-within:shadow-focus-ring">
      <input
        type="url"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder={
          kind === "video"
            ? "https://player.vimeo.com/video/…"
            : "https://cdn.dataweb.com/imagem.jpg"
        }
        className="h-full w-full min-w-0 flex-1 bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-foreground-placeholder outline-none"
      />
    </div>
  );

  const uploadButton = (
    <button
      type="button"
      onClick={() => fileRef.current?.click()}
      className="inline-flex h-9 w-fit shrink-0 items-center gap-2 rounded-regular border border-border-default bg-background-elevated px-3 text-[13px] font-medium text-foreground-subtitle transition-colors hover:bg-background-subtle hover:text-foreground"
    >
      <Upload className="h-3.5 w-3.5" aria-hidden />
      Enviar {kind === "video" ? "vídeo" : "imagem"}
    </button>
  );

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept={kind === "video" ? "video/*" : "image/*"}
      onChange={onFile}
      className="hidden"
    />
  );

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
        {hint ? <p className="text-[12px] text-foreground-muted">{hint}</p> : null}
        {fileInput}
      </div>
    );
  }

  /* ----------------------------- Banner ----------------------------------- */
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground-subtitle">{label}</span>

      <div className="relative flex aspect-[16/7] w-full items-center justify-center overflow-hidden rounded-regular border border-border-default bg-background-subtle">
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
              {kind === "video" ? "Vídeo" : "Imagem"} · cole a URL ou envie
            </span>
          </div>
        )}
        <RemoveButton />
      </div>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        {urlInput}
        {uploadButton}
      </div>

      {hint ? <p className="text-[12px] text-foreground-muted">{hint}</p> : null}
      {fileInput}
    </div>
  );
}
