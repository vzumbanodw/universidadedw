"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TrackCategoryCard } from "@/components/tracks/TrackCategoryCard";
import { cn } from "@/lib/utils";
import type { TrackCategory } from "@/types/tracks";
import type { LearningPathStatus } from "@/types/learning";

export type TrackCategoryWithStatus = TrackCategory & { status: LearningPathStatus };

/**
 * Navegação de aplicações do aluno: busca + filtros Todas / Em andamento /
 * Concluídas, que filtram pelo status REAL de cada aplicação (progresso
 * agregado dos vídeos dos seus cursos).
 */
export function TracksBrowser({ categories }: { categories: TrackCategoryWithStatus[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "in_progress" | "completed">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => (status === "all" ? true : c.status === status))
      .filter((c) =>
        q
          ? c.name.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q)
          : true,
      );
  }, [categories, query, status]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex h-10 flex-1 items-center rounded-regular border border-border-subtle bg-background-elevated transition-colors focus-within:border-foreground-subtitle">
          <Search aria-hidden className="ml-3 h-4 w-4 text-foreground-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar aplicações…"
            aria-label="Buscar aplicações"
            className="flex-1 bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-foreground-muted outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <FilterPill active={status === "all"} onClick={() => setStatus("all")}>
            Todas
          </FilterPill>
          <FilterPill
            active={status === "in_progress"}
            onClick={() => setStatus("in_progress")}
          >
            Em andamento
          </FilterPill>
          <FilterPill
            active={status === "completed"}
            onClick={() => setStatus("completed")}
          >
            Concluídas
          </FilterPill>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-medium border border-dashed border-border-default bg-background-elevated px-6 py-14 text-center">
          <p className="text-[14px] text-foreground-muted">
            {status === "in_progress"
              ? "Nenhuma aplicação em andamento."
              : status === "completed"
                ? "Nenhuma aplicação concluída ainda."
                : "Nenhuma aplicação encontrada para esta busca."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((category) => (
            <TrackCategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
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
