"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  PlayCircle,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { CourseCard } from "./CourseCard";
import { cn } from "@/lib/utils";
import type { Course } from "@/types/courses";

type StatusFilter = "all" | "in_progress" | "certificate";

/**
 * Tela de cursos do aluno: dois atalhos funcionais ("Continuar de onde parou" e
 * "Começar por uma aplicação"), busca e filtros operando no cliente sobre os
 * cursos publicados.
 */
export function CoursesBrowser({ courses }: { courses: Course[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [app, setApp] = useState<string>("all");

  const gridRef = useRef<HTMLDivElement>(null);

  // Curso a retomar: o em andamento mais avançado; senão, o primeiro disponível.
  const continueCourse = useMemo(() => {
    const inProgress = courses
      .filter((course) => course.status === "in_progress")
      .sort((a, b) => b.progress - a.progress);
    return inProgress[0] ?? courses[0];
  }, [courses]);

  // Aplicações disponíveis (categorias do tipo "aplicacao") com cursos.
  const applications = useMemo(
    () => [
      ...new Set(
        courses
          .filter((course) => course.categoryType === "aplicacao")
          .map((course) => course.categoryName),
      ),
    ].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [courses],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((course) => {
      if (status === "in_progress" && course.status !== "in_progress") return false;
      if (status === "certificate" && !course.certificate) return false;
      if (app !== "all" && course.categoryName !== app) return false;
      if (q) {
        const haystack =
          `${course.title} ${course.description} ${course.categoryName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [courses, query, status, app]);

  function pickApplication(name: string) {
    setApp(name);
    setStatus("all");
    // Leva o aluno até a lista filtrada pela aplicação escolhida.
    requestAnimationFrame(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setApp("all");
  }

  return (
    <div className="flex flex-col gap-8">
      <section
        aria-label="Atalhos de cursos"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <ContinueCard course={continueCourse} />
        <StartByApplicationCard
          applications={applications}
          selected={app === "all" ? null : app}
          onPick={pickApplication}
        />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex h-10 flex-1 items-center rounded-regular border border-border-subtle bg-background-elevated transition-colors focus-within:border-foreground-subtitle">
          <Search aria-hidden className="ml-3 h-4 w-4 text-foreground-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar cursos"
            placeholder="Buscar cursos ou aplicações..."
            className="flex-1 bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-foreground-muted outline-none"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:overflow-visible sm:pb-0">
          <FilterPill active={status === "all"} onClick={() => setStatus("all")}>
            Todos
          </FilterPill>
          <FilterPill
            active={status === "in_progress"}
            onClick={() => setStatus("in_progress")}
          >
            Em andamento
          </FilterPill>
          <FilterPill
            active={status === "certificate"}
            onClick={() => setStatus("certificate")}
          >
            Certificação
          </FilterPill>
        </div>
      </div>

      <section
        ref={gridRef}
        aria-label="Cursos por aplicação"
        className="flex scroll-mt-24 flex-col gap-5"
      >
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <span className="inline-flex h-5 items-center rounded-full border border-border-subtle bg-background-subtle px-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
              Aplicações
            </span>
            <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-foreground-heading sm:text-[22px]">
              {app === "all" ? "Cursos por aplicação" : `Cursos · ${app}`}
            </h2>
            <p className="mt-1 max-w-[68ch] text-[13.5px] text-foreground-muted">
              Aprofunde o uso das aplicações da plataforma com cursos objetivos e
              orientados à rotina.
            </p>
          </div>
          {app !== "all" ? (
            <button
              type="button"
              onClick={() => setApp("all")}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 self-start rounded-full border border-border-default bg-background-elevated px-3 text-[12.5px] font-medium text-foreground-subtitle transition-colors hover:border-brand-primary/40 hover:text-foreground sm:self-auto"
            >
              {app}
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </header>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState onReset={resetFilters} />
        )}
      </section>
    </div>
  );
}

/* ---------------------------------- Atalhos -------------------------------- */

function ContinueCard({ course }: { course?: Course }) {
  if (!course) {
    return (
      <div className="flex items-start gap-3 rounded-medium border border-border-subtle bg-background-elevated p-4 shadow-elevation-sm">
        <ShortcutIcon icon={PlayCircle} />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold tracking-tight text-foreground-heading">
            Continuar de onde parou
          </span>
          <span className="mt-1 block text-[12.5px] leading-relaxed text-foreground-muted">
            Nenhum curso disponível ainda. Volte em breve.
          </span>
        </span>
      </div>
    );
  }

  const resuming = course.status === "in_progress";

  return (
    <Link
      href={course.href}
      className="group flex items-start gap-3 rounded-medium border border-border-subtle bg-background-elevated p-4 shadow-elevation-sm transition-[border-color,background-color,box-shadow] hover:border-border-default hover:bg-surface-elevated hover:shadow-elevation-md"
    >
      <ShortcutIcon icon={PlayCircle} />
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold tracking-tight text-foreground-heading">
          Continuar de onde parou
        </span>
        <span className="mt-1 block truncate text-[12.5px] leading-relaxed text-foreground-muted">
          {resuming ? "Retomar" : "Começar"}: {course.title}
        </span>
        {resuming ? (
          <span className="mt-2 block">
            <span
              role="progressbar"
              aria-valuenow={course.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="block h-1.5 w-full overflow-hidden rounded-full bg-background-subtle"
            >
              <span
                className="block h-full rounded-full bg-brand-primary"
                style={{ width: `${course.progress}%` }}
              />
            </span>
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function StartByApplicationCard({
  applications,
  selected,
  onPick,
}: {
  applications: string[];
  selected: string | null;
  onPick: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="group flex w-full items-start gap-3 rounded-medium border border-border-subtle bg-background-elevated p-4 text-left shadow-elevation-sm transition-[border-color,background-color,box-shadow] hover:border-border-default hover:bg-surface-elevated hover:shadow-elevation-md"
      >
        <ShortcutIcon icon={BookOpen} />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold tracking-tight text-foreground-heading">
            Começar por uma aplicação
          </span>
          <span className="mt-1 block text-[12.5px] leading-relaxed text-foreground-muted">
            {selected
              ? `Mostrando cursos de ${selected}.`
              : "Escolha uma aplicação como ponto de partida."}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-foreground-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Aplicações"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-72 overflow-y-auto rounded-medium border border-border-subtle bg-background-elevated p-1.5 shadow-elevation-lg"
        >
          {applications.length === 0 ? (
            <p className="px-3 py-2 text-[12.5px] text-foreground-muted">
              Nenhuma aplicação disponível.
            </p>
          ) : (
            applications.map((name) => {
              const active = selected === name;
              return (
                <button
                  key={name}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onPick(name);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-regular px-3 py-2 text-left text-[13px] transition-colors",
                    active
                      ? "bg-brand-primary/10 text-foreground-heading"
                      : "text-foreground-subtitle hover:bg-background-subtle hover:text-foreground",
                  )}
                >
                  <span className="min-w-0 truncate">{name}</span>
                  {active ? (
                    <Check className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

function ShortcutIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-regular bg-brand-primary/12 text-brand-primary"
    >
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

/* ---------------------------------- Filtros -------------------------------- */

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
        <BookOpen className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="text-[16px] font-semibold tracking-tight text-foreground-heading">
        Nenhum curso encontrado
      </h2>
      <p className="max-w-[40ch] text-[13.5px] leading-relaxed text-foreground-muted">
        Ajuste a busca ou os filtros para ver outros cursos.
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
