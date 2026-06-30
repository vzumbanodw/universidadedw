"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Eye, ListFilter, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ENTRY_BADGE_VARIANT } from "@/components/admin/release-entry-style";
import { monthLabel } from "@/lib/admin/options";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  RELEASE_ENTRY_TYPE_LABEL,
  type ReleaseEntry,
  type ReleaseNote,
} from "@/types/admin";

type MonthGroup = { month: number; notes: ReleaseNote[] };
type YearGroup = { year: number; months: MonthGroup[] };

function groupByYearMonth(notes: ReleaseNote[]): YearGroup[] {
  const sorted = [...notes].sort(
    (a, b) => b.year - a.year || b.month - a.month || b.date.localeCompare(a.date),
  );
  const years = new Map<number, Map<number, ReleaseNote[]>>();
  for (const note of sorted) {
    if (!years.has(note.year)) years.set(note.year, new Map());
    const months = years.get(note.year)!;
    if (!months.has(note.month)) months.set(note.month, []);
    months.get(note.month)!.push(note);
  }
  return [...years.entries()].map(([year, months]) => ({
    year,
    months: [...months.entries()].map(([month, monthNotes]) => ({
      month,
      notes: monthNotes,
    })),
  }));
}

type YearFilter = number | "all";
type MonthFilter = number | "all";

export function NovidadesBrowser({ notes }: { notes: ReleaseNote[] }) {
  const [year, setYear] = useState<YearFilter>("all");
  const [month, setMonth] = useState<MonthFilter>("all");

  // Anos disponíveis (desc).
  const years = useMemo(
    () => [...new Set(notes.map((n) => n.year))].sort((a, b) => b - a),
    [notes],
  );

  // Meses disponíveis para o ano selecionado (ou todos os anos).
  const months = useMemo(() => {
    const scope = year === "all" ? notes : notes.filter((n) => n.year === year);
    return [...new Set(scope.map((n) => n.month))].sort((a, b) => a - b);
  }, [notes, year]);

  const filtered = useMemo(
    () =>
      notes.filter(
        (n) =>
          (year === "all" || n.year === year) &&
          (month === "all" || n.month === month),
      ),
    [notes, year, month],
  );

  const groups = useMemo(() => groupByYearMonth(filtered), [filtered]);

  function selectYear(value: YearFilter) {
    setYear(value);
    setMonth("all"); // mês depende do ano, reseta ao trocar
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Barra de filtros */}
      <div className="sticky top-16 z-30 -mx-1 mt-8 rounded-large border border-border-subtle bg-background-elevated/90 p-3 shadow-elevation-sm backdrop-blur-xl sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-foreground-muted">
            <ListFilter className="h-3.5 w-3.5" aria-hidden />
            Filtrar
          </span>

          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Ano */}
            <div className="flex items-center gap-1.5">
              <span className="mr-1 text-[12px] font-medium text-foreground-muted">Ano</span>
              <Chip active={year === "all"} onClick={() => selectYear("all")}>
                Todos
              </Chip>
              {years.map((y) => (
                <Chip key={y} active={year === y} onClick={() => selectYear(y)}>
                  {y}
                </Chip>
              ))}
            </div>

            <span aria-hidden className="hidden h-5 w-px bg-border-subtle sm:block" />

            {/* Mês */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[12px] font-medium text-foreground-muted">Mês</span>
              <Chip active={month === "all"} onClick={() => setMonth("all")}>
                Todos
              </Chip>
              {months.map((m) => (
                <Chip key={m} active={month === m} onClick={() => setMonth(m)}>
                  {monthLabel(m)}
                </Chip>
              ))}
            </div>
          </div>

          <span className="shrink-0 text-[12.5px] text-foreground-muted lg:ml-auto">
            <strong className="font-semibold tabular-nums text-foreground-heading">
              {filtered.length}
            </strong>{" "}
            {filtered.length === 1 ? "publicação" : "publicações"}
          </span>
        </div>
      </div>

      {/* Resultado */}
      {groups.length === 0 ? (
        <FilteredEmpty onReset={() => selectYear("all")} />
      ) : (
        <div className="flex flex-col gap-16">
          {groups.map((group) => (
            <section key={group.year} className="scroll-mt-40">
              <div className="mb-8 flex items-center gap-4">
                <h2 className="text-[26px] font-semibold tracking-tight text-foreground-heading">
                  {group.year}
                </h2>
                <span className="h-px flex-1 bg-border-subtle" aria-hidden />
              </div>
              <div className="flex flex-col gap-12">
                {group.months.map(({ month: m, notes: monthNotes }) => (
                  <div key={m} className="flex flex-col gap-6">
                    <h3 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-brand-primary">
                      {monthLabel(m)}
                    </h3>
                    <div className="flex flex-col gap-8">
                      {monthNotes.map((note) => (
                        <ReleaseCard key={note.id} note={note} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Chip                                                                        */
/* -------------------------------------------------------------------------- */

function Chip({
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
        "inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-brand-primary text-white shadow-elevation-sm"
          : "border border-border-default bg-background-elevated text-foreground-subtitle hover:border-brand-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Release card                                                                */
/* -------------------------------------------------------------------------- */

function ReleaseCard({ note }: { note: ReleaseNote }) {
  const entries = [...note.entries].sort((a, b) => a.order - b.order);

  return (
    <article className="overflow-hidden rounded-large border border-border-subtle bg-background-elevated shadow-elevation-sm">
      {note.heroImageUrl ? (
        <div className="relative aspect-[16/6] w-full overflow-hidden border-b border-border-subtle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={note.heroImageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div
          aria-hidden
          className="h-2 w-full bg-gradient-to-r from-brand-primary via-brand-tertiary to-brand-secondary"
        />
      )}

      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <Badge variant="primary">v{note.version}</Badge>
              <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-foreground-muted">
                {monthLabel(note.month)} de {note.year}
              </span>
            </div>
            <h3 className="mt-3 text-balance text-[22px] font-semibold leading-tight tracking-tight text-foreground-heading sm:text-[26px]">
              {note.title}
            </h3>
          </div>

          {note.authorName ? (
            <div className="flex shrink-0 items-center gap-2.5 rounded-regular border border-border-subtle bg-background-subtle px-3 py-2">
              <Avatar name={note.authorName} src={note.authorAvatarUrl} size="sm" />
              <div className="leading-tight">
                <p className="text-[13px] font-semibold text-foreground-heading">
                  {note.authorName}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-foreground-muted">
                  <CalendarDays className="h-3 w-3" aria-hidden />
                  {formatDate(note.date)}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {note.summary ? (
          <p className="mt-4 max-w-[70ch] text-[15px] leading-relaxed text-foreground-subtitle">
            {note.summary}
          </p>
        ) : null}

        {entries.length > 0 ? (
          <div className="mt-7">
            <Changelog entries={entries} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Changelog                                                                   */
/* -------------------------------------------------------------------------- */

function Changelog({ entries }: { entries: ReleaseEntry[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-medium border border-border-subtle sm:block">
        <table className="w-full border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="bg-background-subtle text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground-muted">
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Caso</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3 text-center">Ver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {entries.map((entry) => (
              <tr key={entry.id} className="align-top transition-colors hover:bg-background-subtle/50">
                <td className="px-4 py-4">
                  <Badge variant={ENTRY_BADGE_VARIANT[entry.type]} size="sm">
                    {RELEASE_ENTRY_TYPE_LABEL[entry.type]}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-4 font-medium text-foreground-subtitle">
                  {entry.caso || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-foreground-subtitle">
                  {entry.produto || "-"}
                </td>
                <td className="px-4 py-4 text-foreground-muted">
                  <p className="max-w-[460px] leading-relaxed">{entry.description}</p>
                </td>
                <td className="px-4 py-4 text-center">
                  <ViewLink url={entry.viewUrl} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-medium border border-border-subtle bg-background-subtle/40 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge variant={ENTRY_BADGE_VARIANT[entry.type]} size="sm">
                {RELEASE_ENTRY_TYPE_LABEL[entry.type]}
              </Badge>
              <ViewLink url={entry.viewUrl} />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-foreground-muted">
              {entry.caso ? (
                <span className="font-medium text-foreground-subtitle">{entry.caso}</span>
              ) : null}
              {entry.caso && entry.produto ? <span aria-hidden>·</span> : null}
              {entry.produto ? <span>{entry.produto}</span> : null}
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-foreground-subtitle">
              {entry.description}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

function ViewLink({ url }: { url?: string }) {
  if (!url) {
    return <Eye className="mx-auto h-4 w-4 text-icon-disabled" aria-hidden />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label="Visualizar atualização"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-primary transition-colors hover:bg-brand-primary/10"
    >
      <Eye className="h-4 w-4" />
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty (resultado filtrado)                                                  */
/* -------------------------------------------------------------------------- */

function FilteredEmpty({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-large border border-dashed border-border-default bg-background-elevated px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-medium bg-brand-primary/10 text-brand-primary">
        <Sparkles className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="text-[16px] font-semibold tracking-tight text-foreground-heading">
        Nenhuma atualização neste período
      </h2>
      <p className="max-w-[40ch] text-[13.5px] leading-relaxed text-foreground-muted">
        Não há publicações para o ano e mês selecionados.
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
