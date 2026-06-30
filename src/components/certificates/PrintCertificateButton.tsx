"use client";

import { Download } from "lucide-react";

/** Botão que dispara a impressão do navegador (Salvar como PDF) — escondido na impressão. */
export function PrintCertificateButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-regular bg-button-primary px-5 text-sm font-medium text-white shadow-elevation-sm transition-colors hover:bg-brand-dark"
    >
      <Download className="h-4 w-4" aria-hidden />
      Baixar / Imprimir certificado
    </button>
  );
}
