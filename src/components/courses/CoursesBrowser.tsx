"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  PlayCircle,
  Search,
} from "lucide-react";
import { CourseCard } from "@/components/courses/CourseCard";
import { cn } from "@/lib/utils";
import type { Course } from "@/types/courses";

export type ApplicationOption = { id: string; name: string; slug: string };

type CoursesBrowserProps = {
  courses: Course[];
  applications: ApplicationOption[];
  /** Link do curso para "Continuar de onde parou" (vazio se nada iniciado). */
  continueHref?: string;
  continueTitle?: string;
};

/**
 * Navegação interativa de cursos do aluno: atalhos (Continuar / Selecionar
 * aplicação) + busca + filtros (Todos / Em andamento) que realmente filtram a
 * grade, usando o status REAL de cada curso (progresso por vídeos).
 */
export function CoursesBrowser({
  courses,
  applications,
  continueHref,
  continueTitle,
}: CoursesBrowserProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "in_progress">("all");
  const [appOpen, setAppOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses
      .filter((c) => (status === "in_progress" ? c.status === "in_progress" : true))
      .filter((c) =>
        q
          ? c.title.toLowerCase().includes(q) ||
            c.categoryName.toLowerCase().includes(q)
          : true,
      );
  }, [courses, query, status]);

  return (
    <div className="flex flex-col gap-8">
      {/* Atalhos */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {continueHref ? (
          <Link href={continueHref} className={SHORTCUT_CLASS}>
            <ShortcutIcon>
              <PlayCircle className="h-[18px] w-[18px]" />
            </ShortcutIcon>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold tracking-tight text-foreground-heading">
                Continuar de onde parou
              </span>
              <span className="mt-1 block truncate text-[12.5px] text-foreground-muted">
                {continueTitle ?? "Retome seu último curso em andamento."}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
          </Link>
        ) : (
          <div className={cn(SHORTCUT_CLASS, "cursor-default opacity-70")}>
            <ShortcutIcon>
              <PlayCircle className="h-[18px] w-[18px]" />
            </ShortcutIcon>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold tracking-tight text-foreground-heading">
                Continuar de onde parou
              </span>
              <span className="mt-1 block text-[12.5px] text-foreground-muted">
                Comece um curso para destravar este atalho.
              </span>
            </span>
          </div>
        )}

        {/* Selecionar uma aplicação (dropdown funcional) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setAppOpen((o) => !o)}
            aria-expanded={appOpen}
            disabled={applications.length === 0}
            className={cn(SHORTCUT_CLASS, "w-full disabled:opacity-60")}
          >
            <ShortcutIcon>
              <BookOpen className="h-[18px] w-[18px]" />
            </ShortcutIcon>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[14px] font-semibold tracking-tight text-foreground-heading">
                Selecionar uma aplicação
              </span>
              <span className="mt-1 block text-[12.5px] text-foreground-muted">
                Vá direto para os cursos de uma aplicação.
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-foreground-muted transition-transform",
                appOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>

          {appOpen ? (
            <>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setAppOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div className="absolute left-0 right-0 z-20 mt-1.5 max-h-72 overflow-y-auto rounded-medium border border-border-subtle bg-background-elevated p-1.5 shadow-elevation-lg">
                {applications.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => {
                      setAppOpen(false);
                      router.push(`/dashboard/trilhas/${app.slug}`);
                    }}
                    className="flex w-full items-center gap-2 rounded-regular px-3 py-2 text-left text-[13.5px] text-foreground-subtitle transition-colors hover:bg-background-subtle hover:text-foreground"
                  >
                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-foreground-muted" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{app.name}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* Busca + filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex h-10 flex-1 items-center rounded-regular border border-border-subtle bg-background-elevated transition-colors focus-within:border-foreground-subtitle">
          <Search aria-hidden className="ml-3 h-4 w-4 text-foreground-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cursos ou aplicações..."
            aria-label="Buscar cursos"
            className="flex-1 bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-foreground-muted outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <FilterPill active={status === "all"} onClick={() => setStatus("all")}>
            Todos
          </FilterPill>
          <FilterPill
            active={status === "in_progress"}
            onClick={() => setStatus("in_progress")}
          >
            Em andamento
          </FilterPill>
        </div>
      </div>

      {/* Grade */}
      {filtered.length === 0 ? (
        <div className="rounded-medium border border-dashed border-border-default bg-background-elevated px-6 py-14 text-center">
          <p className="text-[14px] text-foreground-muted">
            {status === "in_progress"
              ? "Você não tem cursos em andamento. Comece um curso para vê-lo aqui."
              : "Nenhum curso encontrado para esta busca."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

const SHORTCUT_CLASS =
  "group flex items-center gap-3 rounded-medium border border-border-subtle bg-background-elevated p-4 shadow-elevation-sm transition-[border-color,background-color,box-shadow] hover:border-border-default hover:bg-surface-elevated hover:shadow-elevation-md";

function ShortcutIcon({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-regular bg-brand-primary/12 text-brand-primary"
    >
      {children}
    </span>
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
