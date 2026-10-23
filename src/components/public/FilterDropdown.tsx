"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

type FilterDropdownProps = {
  /** Rótulo fixo do filtro ("Tipo", "Período"). */
  label: string;
  /** Resumo da seleção atual ("Todos", "2 selecionados", "Últimos 30 dias"). */
  summary: string;
  /** Destaca o gatilho quando há seleção ativa. */
  active?: boolean;
  children: ReactNode;
};

/**
 * Dropdown compacto da barra de filtros das novidades.
 *
 * Feito sob medida (em vez do Select de formulário) porque aqui o controle
 * precisa ser baixo, caber ao lado dos chips e aceitar multi-seleção com
 * checkboxes. Fecha ao clicar fora, com Escape, e devolve o foco ao gatilho.
 */
export function FilterDropdown({
  label,
  summary,
  active,
  children,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={[
          "inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border px-3 text-[12.5px] transition-all duration-150",
          active
            ? "border-brand-primary bg-brand-primary/12 text-[#036B77] shadow-[0_0_0_3px_rgba(0,160,177,0.10)]"
            : "border-border-subtle bg-background-elevated text-foreground-subtitle hover:border-border-strong hover:text-foreground",
        ].join(" ")}
      >
        <span className="font-medium">{label}</span>
        <span className={active ? "font-semibold" : "text-foreground-muted"}>
          {summary}
        </span>
        <ChevronDown
          className={[
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="group"
          aria-label={label}
          className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-[232px] origin-top animate-fade-in-up overflow-hidden rounded-medium border border-border-subtle bg-background-elevated p-1.5 shadow-elevation-xl motion-reduce:animate-none"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** Linha de opção do dropdown: multi (checkbox) ou única (radio). */
export function DropdownOption({
  selected,
  onSelect,
  children,
  count,
  dotClass,
  multi,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  count?: number;
  dotClass?: string;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onSelect}
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-regular px-2.5 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-background-subtle"
    >
      <span
        aria-hidden
        className={[
          "flex h-4 w-4 shrink-0 items-center justify-center border transition-colors",
          multi ? "rounded-[5px]" : "rounded-full",
          selected
            ? "border-brand-primary bg-brand-primary text-white"
            : "border-border-strong bg-background",
        ].join(" ")}
      >
        {selected ? (
          multi ? (
            <Check className="h-3 w-3" strokeWidth={3} />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          )
        ) : null}
      </span>

      {dotClass ? (
        <span className={["h-2 w-2 shrink-0 rounded-full", dotClass].join(" ")} aria-hidden />
      ) : null}

      <span className="min-w-0 flex-1 truncate">{children}</span>

      {typeof count === "number" ? (
        <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-foreground-muted">
          {count}
        </span>
      ) : null}
    </button>
  );
}
