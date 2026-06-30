"use client";

import { useMemo, useState } from "react";
import { Compass, Search } from "lucide-react";
import { TrackCategoriesSection } from "./TrackCategoriesSection";
import { cn } from "@/lib/utils";
import type { TrackCategory } from "@/types/tracks";

type TrackFilter = "all" | "in_progress" | "completed";

/**
 * Busca + filtros das trilhas (Todas / Em andamento / Concluídas), operando no
 * cliente sobre as categorias publicadas. Substitui a barra estática que não
 * filtrava nada.
 */
export function TrilhasBrowser({ categories }: { categories: TrackCategory[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TrackFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories.filter((category) => {
      if (filter === "in_progress" && category.inProgress <= 0) return false;
      if (filter === "completed" && category.completed <= 0) return false;
      if (q) {
        const haystack = `${category.name} ${category.tagline}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [categories, query, filter]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex h-10 flex-1 items-center rounded-regular border border-border-subtle bg-background-elevated transition-colors focus-within:border-foreground-subtitle">
          <Search aria-hidden className="ml-3 h-4 w-4 text-foreground-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar trilhas"
            placeholder="Buscar trilhas ou aplicações…"
            className="flex-1 bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-foreground-muted outline-none"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:overflow-visible sm:pb-0">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
            Todas
          </FilterPill>
          <FilterPill
            active={filter === "in_progress"}
            onClick={() => setFilter("in_progress")}
          >
            Em andamento
          </FilterPill>
          <FilterPill
            active={filter === "completed"}
            onClick={() => setFilter("completed")}
          >
            Concluídas
          </FilterPill>
        </div>
      </div>

      {filtered.length > 0 ? (
        <TrackCategoriesSection
          eyebrow="Aplicações"
          title="Trilhas por aplicação"
          description="Domine cada aplicação da plataforma na ordem certa, do primeiro acesso até a operação avançada."
          categories={filtered}
        />
      ) : (
        <EmptyState
          onReset={() => {
            setQuery("");
            setFilter("all");
          }}
        />
      )}
    </div>
  );
}

function FilterPill({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 shrink-0 items-center rounded-regular px-3.5 text-[13px] font-medium transition-colors",
        active
          ? "border border-foreground-heading bg-foreground-heading text-background-elevated"
          : "border border-border-subtle bg-background-elevated text-foreground-subtitle hover:border-border-default hover:bg-background-subtle hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-large border border-dashed border-border-default bg-background-elevated px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-medium bg-brand-primary/10 text-brand-primary">
        <Compass className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="text-[16px] font-semibold tracking-tight text-foreground-heading">
        Nenhuma trilha encontrada
      </h2>
      <p className="max-w-[40ch] text-[13.5px] leading-relaxed text-foreground-muted">
        Ajuste a busca ou os filtros para ver outras aplicações.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-1 inline-flex h-9 items-center rounded-regular border border-border-default px-3.5 text-[13px] font-medium text-foreground-subtitle transition-colors hover:border-brand-primary hover:text-brand-primary"
      >
        Limpar filtros
      </button>
    </div>
  );
}
