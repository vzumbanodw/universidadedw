"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Link2,
  MessageCircle,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { canonicalProduct } from "@/lib/releases/products";
import {
  DropdownOption,
  FilterDropdown,
} from "@/components/public/FilterDropdown";
import {
  RELEASE_ENTRY_TYPE_LABEL,
  type ReleaseEntry,
  type ReleaseEntryType,
  type ReleaseNote,
} from "@/types/admin";

/* -------------------------------------------------------------------------- */
/* Tokens visuais por tipo de entrega                                          */
/* -------------------------------------------------------------------------- */

type TypeStyle = { dot: string; chip: string; label: string; plural: string };

const TYPE_STYLE: Record<ReleaseEntryType, TypeStyle> = {
  novidade: {
    dot: "bg-brand-primary",
    chip: "border-brand-primary/30 bg-brand-primary/10 text-[#036B77] dark:text-brand-primary",
    label: "Novidade",
    plural: "Novidades",
  },
  melhoria: {
    dot: "bg-brand-green",
    chip: "border-brand-green/35 bg-brand-green/12 text-[#4E7016] dark:text-brand-green",
    label: "Melhoria",
    plural: "Melhorias",
  },
  correcao: {
    dot: "bg-brand-orange",
    chip: "border-brand-orange/35 bg-brand-orange/12 text-[#8A5A05] dark:text-brand-orange",
    label: "Correção",
    plural: "Correções",
  },
  seguranca: {
    dot: "bg-brand-tertiary",
    chip: "border-brand-tertiary/30 bg-brand-tertiary/10 text-brand-tertiary",
    label: "Segurança",
    plural: "Segurança",
  },
};

const TYPE_ORDER: ReleaseEntryType[] = ["novidade", "melhoria", "correcao", "seguranca"];

const LAST_VISIT_KEY = "dw:novidades:ultima-visita";

/** Períodos do filtro de data (janelas relativas + anos). */
type DateFilter = string; // "all" | "30d" | "90d" | "180d" | "year:2026"

const DATE_WINDOWS: { value: DateFilter; label: string; days: number }[] = [
  { value: "30d", label: "Últimos 30 dias", days: 30 },
  { value: "90d", label: "Últimos 3 meses", days: 90 },
  { value: "180d", label: "Últimos 6 meses", days: 180 },
  { value: "365d", label: "Último ano", days: 365 },
];

function dateFilterLabel(value: DateFilter): string {
  if (value === "all") return "Qualquer data";
  const window = DATE_WINDOWS.find((w) => w.value === value);
  if (window) return window.label;
  return value.startsWith("year:") ? value.slice(5) : "Qualquer data";
}

function matchesDate(note: ReleaseNote, value: DateFilter): boolean {
  if (value === "all") return true;
  const when = noteDate(note);
  if (value.startsWith("year:")) return when.getFullYear() === Number(value.slice(5));
  const window = DATE_WINDOWS.find((w) => w.value === value);
  if (!window) return true;
  return Date.now() - when.getTime() <= window.days * 86_400_000;
}

const WHATSAPP_URL =
  "https://wa.me/555130276030?text=Ol%C3%A1%21%20Vi%20uma%20atualiza%C3%A7%C3%A3o%20na%20p%C3%A1gina%20de%20novidades%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es";

/* -------------------------------------------------------------------------- */
/* Utilidades                                                                  */
/* -------------------------------------------------------------------------- */

function noteDate(note: ReleaseNote): Date {
  const parsed = note.date ? new Date(note.date) : null;
  if (parsed && !Number.isNaN(parsed.getTime())) return parsed;
  return new Date(note.year, Math.max(0, note.month - 1), 1);
}

function formatDay(note: ReleaseNote): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  })
    .format(noteDate(note))
    .replace(".", "");
}

function formatRelative(note: ReleaseNote): string {
  const days = Math.round((Date.now() - noteDate(note).getTime()) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (days < 1) return "hoje";
  if (days < 30) return rtf.format(-days, "day");
  if (days < 365) return rtf.format(-Math.round(days / 30), "month");
  return rtf.format(-Math.round(days / 365), "year");
}

function noteAnchor(note: ReleaseNote): string {
  return `v${note.version}`.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
}

function entryTitle(entry: ReleaseEntry): string {
  return entry.titulo?.trim() || entry.description.trim();
}

function entryMatches(entry: ReleaseEntry, q: string): boolean {
  return [entry.titulo, entry.description, entry.produto, entry.caso]
    .filter(Boolean)
    .some((f) => (f as string).toLowerCase().includes(q));
}

/* -------------------------------------------------------------------------- */
/* Componente principal                                                        */
/* -------------------------------------------------------------------------- */

export function NovidadesBrowser({ notes }: { notes: ReleaseNote[] }) {
  const [products, setProducts] = useState<string[]>([]);
  const [types, setTypes] = useState<ReleaseEntryType[]>([]);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [lastVisit, setLastVisit] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAST_VISIT_KEY);
      if (raw && Number.isFinite(Number(raw))) setLastVisit(Number(raw));
      window.localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
    } catch {
      /* sem storage: a página funciona igual, só não marca o que é novo */
    }
  }, []);

  const availableProducts = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) =>
      n.entries.forEach((e) => {
        const name = canonicalProduct(e.produto);
        if (name) set.add(name);
      }),
    );
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [notes]);

  const availableTypes = useMemo(() => {
    const set = new Set<ReleaseEntryType>();
    notes.forEach((n) => n.entries.forEach((e) => set.add(e.type)));
    return TYPE_ORDER.filter((t) => set.has(t));
  }, [notes]);

  const availableYears = useMemo(
    () => [...new Set(notes.map((n) => noteDate(n).getFullYear()))].sort((a, b) => b - a),
    [notes],
  );

  const typeCounts = useMemo(() => {
    const counts = new Map<ReleaseEntryType, number>();
    notes.forEach((n) =>
      n.entries.forEach((e) => counts.set(e.type, (counts.get(e.type) ?? 0) + 1)),
    );
    return counts;
  }, [notes]);

  const q = query.trim().toLowerCase();
  const hasFilters =
    products.length > 0 || types.length > 0 || q.length > 0 || dateFilter !== "all";

  const visibleNotes = useMemo(() => {
    return notes
      .filter((note) => matchesDate(note, dateFilter))
      .map((note) => {
        const scoped = note.entries.filter((entry) => {
          if (
            products.length > 0 &&
            !products.includes(canonicalProduct(entry.produto))
          ) {
            return false;
          }
          return types.length === 0 || types.includes(entry.type);
        });

        if (!q) return { note, entries: scoped };

        const matched = scoped.filter((e) => entryMatches(e, q));
        if (matched.length > 0) return { note, entries: matched };
        const noteMatches =
          note.title.toLowerCase().includes(q) ||
          (note.summary ?? "").toLowerCase().includes(q) ||
          `v${note.version}`.toLowerCase().includes(q);
        return { note, entries: noteMatches ? scoped : [] };
      })
      .filter(({ entries }) => entries.length > 0);
  }, [notes, products, types, q, dateFilter]);

  const visibleCount = visibleNotes.reduce((s, { entries }) => s + entries.length, 0);

  const freshCount = useMemo(
    () =>
      lastVisit ? notes.filter((n) => noteDate(n).getTime() > lastVisit).length : 0,
    [notes, lastVisit],
  );

  function clearFilters() {
    setProducts([]);
    setTypes([]);
    setQuery("");
    setDateFilter("all");
  }

  return (
    <div className="relative -mt-16 flex flex-col gap-8">
      {/* ---------------------------------------------------------------- */}
      {/* Command bar: busca + filtros, flutuando sobre a borda do hero      */}
      {/* ---------------------------------------------------------------- */}
      <div className="sticky top-4 z-40 animate-fade-in-up rounded-large border border-border-subtle bg-background-elevated/95 shadow-elevation-xl backdrop-blur-2xl motion-reduce:animate-none">
        <div className="flex h-14 items-center gap-3 border-b border-border-subtle px-4 sm:px-5">
          <Search aria-hidden className="h-[18px] w-[18px] shrink-0 text-foreground-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por recurso, produto ou versão…"
            aria-label="Buscar nas atualizações"
            className="h-full flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-foreground-muted"
          />
          <span className="hidden shrink-0 items-center gap-1.5 text-[12px] tabular-nums text-foreground-muted sm:inline-flex">
            <strong className="font-semibold text-foreground-heading">{visibleCount}</strong>
            {visibleCount === 1 ? "entrega" : "entregas"}
          </span>
        </div>

        <div className="flex flex-col gap-3 px-4 py-3.5 sm:px-5">
          {/* Produtos: sempre à vista — é o filtro mais usado pelo cliente */}
          {availableProducts.length > 0 ? (
            <fieldset className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <legend className="sr-only">Produto</legend>
              <span
                aria-hidden
                className="shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-foreground-muted sm:w-[64px]"
              >
                Produto
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {availableProducts.map((name) => (
                  <Chip
                    key={name}
                    active={products.includes(name)}
                    onClick={() =>
                      setProducts((prev) =>
                        prev.includes(name)
                          ? prev.filter((p) => p !== name)
                          : [...prev, name],
                      )
                    }
                  >
                    {name}
                  </Chip>
                ))}
              </div>
            </fieldset>
          ) : null}

          {/* Demais filtros: dropdowns compactos */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
            <span
              aria-hidden
              className="shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-foreground-muted sm:w-[64px]"
            >
              Refinar
            </span>

            {availableTypes.length > 0 ? (
              <FilterDropdown
                label="Tipo"
                active={types.length > 0}
                summary={
                  types.length === 0
                    ? "Todos"
                    : types.length === 1
                      ? TYPE_STYLE[types[0]!].label
                      : `${types.length} selecionados`
                }
              >
                <DropdownOption
                  multi
                  selected={types.length === 0}
                  onSelect={() => setTypes([])}
                >
                  Todos os tipos
                </DropdownOption>
                <span aria-hidden className="my-1 block h-px bg-border-subtle" />
                {availableTypes.map((type) => (
                  <DropdownOption
                    key={type}
                    multi
                    selected={types.includes(type)}
                    dotClass={TYPE_STYLE[type].dot}
                    count={typeCounts.get(type)}
                    onSelect={() =>
                      setTypes((prev) =>
                        prev.includes(type)
                          ? prev.filter((t) => t !== type)
                          : [...prev, type],
                      )
                    }
                  >
                    {TYPE_STYLE[type].label}
                  </DropdownOption>
                ))}
              </FilterDropdown>
            ) : null}

            <FilterDropdown
              label="Período"
              active={dateFilter !== "all"}
              summary={dateFilter === "all" ? "Qualquer data" : dateFilterLabel(dateFilter)}
            >
              <DropdownOption
                selected={dateFilter === "all"}
                onSelect={() => setDateFilter("all")}
              >
                Qualquer data
              </DropdownOption>
              <span aria-hidden className="my-1 block h-px bg-border-subtle" />
              {DATE_WINDOWS.map((window) => (
                <DropdownOption
                  key={window.value}
                  selected={dateFilter === window.value}
                  onSelect={() => setDateFilter(window.value)}
                  count={
                    notes.filter((n) => matchesDate(n, window.value)).length || undefined
                  }
                >
                  {window.label}
                </DropdownOption>
              ))}
              {availableYears.length > 1 ? (
                <>
                  <span aria-hidden className="my-1 block h-px bg-border-subtle" />
                  {availableYears.map((year) => (
                    <DropdownOption
                      key={year}
                      selected={dateFilter === `year:${year}`}
                      onSelect={() => setDateFilter(`year:${year}`)}
                      count={notes.filter((n) => noteDate(n).getFullYear() === year).length}
                    >
                      {year}
                    </DropdownOption>
                  ))}
                </>
              ) : null}
            </FilterDropdown>

            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium text-foreground-brand transition-colors hover:bg-brand-primary/10"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Limpar
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Novidades desde a última visita */}
      {freshCount > 0 && !hasFilters ? (
        <p className="flex items-center gap-2.5 rounded-regular border border-brand-primary/25 bg-brand-primary/[0.07] px-4 py-3 text-[13.5px] text-foreground-heading">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-primary opacity-70 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-primary" />
          </span>
          <strong className="font-semibold">
            {freshCount === 1
              ? "1 atualização nova"
              : `${freshCount} atualizações novas`}
          </strong>
          desde a sua última visita
        </p>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Timeline de releases                                              */}
      {/* ---------------------------------------------------------------- */}
      {visibleNotes.length === 0 ? (
        <FilteredEmpty query={query} onReset={clearFilters} />
      ) : (
        <div className="relative flex flex-col gap-14 pt-2">
          {/* Rail vertical conectando as versões (só no desktop) */}
          <span
            aria-hidden
            className="absolute left-[9px] top-6 hidden w-[2px] rounded-full bg-gradient-to-b from-brand-primary via-border-strong to-transparent lg:block"
            style={{ height: "calc(100% - 3rem)" }}
          />

          {visibleNotes.map(({ note, entries }, index) => (
            <ReleaseBlock
              key={note.id}
              note={note}
              entries={entries}
              isNew={Boolean(lastVisit && noteDate(note).getTime() > lastVisit)}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bloco de release                                                            */
/* -------------------------------------------------------------------------- */

function ReleaseBlock({
  note,
  entries,
  isNew,
  index,
}: {
  note: ReleaseNote;
  entries: ReleaseEntry[];
  isNew: boolean;
  index: number;
}) {
  const [copied, setCopied] = useState(false);
  const anchor = noteAnchor(note);
  const highlights = entries.filter((e) => e.destaque);
  const rest = entries.filter((e) => !e.destaque);
  const actionNeeded = entries.filter((e) => e.requerAcao);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${window.location.pathname}#${anchor}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard indisponível: dá para copiar da barra de endereço */
    }
  }

  return (
    <section
      id={anchor}
      className="relative scroll-mt-28 animate-fade-in-up motion-reduce:animate-none lg:pl-12"
      style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}
    >
      {/* Nó do rail */}
      <span
        aria-hidden
        className={[
          "absolute left-0 top-[5px] hidden h-5 w-5 items-center justify-center rounded-full border-2 bg-background lg:flex",
          isNew ? "border-brand-primary" : "border-border-strong",
        ].join(" ")}
      >
        <span
          className={[
            "h-2 w-2 rounded-full",
            isNew ? "bg-brand-primary" : "bg-border-strong",
          ].join(" ")}
        />
      </span>

      {/* Cabeçalho da versão */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center rounded-md border border-brand-primary/30 bg-brand-primary/10 px-2.5 py-1 font-mono text-[12.5px] font-semibold tabular-nums tracking-tight text-[#036B77]">
            v{note.version}
          </span>
          <time className="text-[12.5px] text-foreground-muted">
            {formatDay(note)} · {formatRelative(note)}
          </time>
          {isNew ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/12 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#036B77]">
              Novo
            </span>
          ) : null}
          <button
            type="button"
            onClick={copyLink}
            title="Copiar link desta atualização"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] text-foreground-muted transition-colors hover:bg-background-subtle hover:text-foreground"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Link2 className="h-3.5 w-3.5" aria-hidden />
            )}
            {copied ? "Copiado" : "Link"}
          </button>
        </div>

        <h2 className="text-balance text-[26px] font-semibold leading-[1.12] tracking-[-0.015em] text-foreground-heading sm:text-[32px]">
          {note.title}
        </h2>
        {note.summary ? (
          <p className="max-w-[68ch] text-[15.5px] leading-relaxed text-foreground-subtitle">
            {note.summary}
          </p>
        ) : null}

        {actionNeeded.length > 0 ? (
          <p className="flex items-start gap-2.5 rounded-regular border border-border-warning/50 bg-background-warning px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              <strong className="font-semibold">
                {actionNeeded.length === 1
                  ? "1 item precisa de uma ação sua"
                  : `${actionNeeded.length} itens precisam de uma ação sua`}
              </strong>{" "}
              — veja os marcados abaixo.
            </span>
          </p>
        ) : null}
      </header>

      {/* Bento dos destaques: o primeiro ocupa a largura toda */}
      {highlights.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {highlights.map((entry, i) => (
            <HighlightCard
              key={entry.id}
              entry={entry}
              wide={highlights.length % 2 === 1 && i === 0}
            />
          ))}
        </div>
      ) : null}

      {/* Demais entregas */}
      {rest.length > 0 ? (
        <ul className="mt-3 overflow-hidden rounded-large border border-border-subtle bg-background-elevated">
          {rest.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 text-[13px] font-medium text-foreground-muted transition-colors hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Dúvidas sobre esta entrega? Fale com a gente
          <ArrowUpRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </a>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Cartões                                                                      */
/* -------------------------------------------------------------------------- */

function HighlightCard({ entry, wide }: { entry: ReleaseEntry; wide?: boolean }) {
  const product = canonicalProduct(entry.produto);
  const style = TYPE_STYLE[entry.type];

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-large border border-border-subtle bg-background-elevated p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-brand-primary/35 hover:shadow-elevation-md motion-reduce:hover:translate-y-0",
        wide ? "sm:col-span-2" : "",
      ].join(" ")}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      />
      <div className="flex flex-wrap items-center gap-2">
        <TypeChip type={entry.type} />
        {product ? <ProductTag name={product} /> : null}
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-primary">
          <Sparkles className="h-3 w-3" aria-hidden />
          Destaque
        </span>
      </div>

      <h3
        className={[
          "mt-3 font-semibold leading-snug tracking-[-0.01em] text-foreground-heading",
          wide ? "text-[20px] sm:text-[23px]" : "text-[17px]",
        ].join(" ")}
      >
        {entryTitle(entry)}
      </h3>
      {entry.titulo && entry.description ? (
        <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-foreground-subtitle">
          {entry.description}
        </p>
      ) : null}
      <EntryMeta entry={entry} />
    </article>
  );
}

function EntryRow({ entry }: { entry: ReleaseEntry }) {
  const product = canonicalProduct(entry.produto);
  return (
    <li className="group flex flex-col gap-2 border-b border-border-subtle px-5 py-4 transition-colors last:border-b-0 hover:bg-background-subtle/50 sm:flex-row sm:items-start sm:gap-5">
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:w-[210px]">
        <TypeChip type={entry.type} />
        {product ? <ProductTag name={product} /> : null}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-medium leading-snug text-foreground-heading">
          {entryTitle(entry)}
          {entry.requerAcao ? (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-border-warning/50 bg-background-warning px-2 py-0.5 align-middle text-[10.5px] font-semibold uppercase tracking-[0.08em] text-foreground-warning">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              Requer ação
            </span>
          ) : null}
        </h3>
        {entry.titulo && entry.description ? (
          <p className="mt-1 max-w-[70ch] text-[13.5px] leading-relaxed text-foreground-subtitle">
            {entry.description}
          </p>
        ) : null}
        <EntryMeta entry={entry} />
      </div>
    </li>
  );
}

function TypeChip({ type }: { type: ReleaseEntryType }) {
  const style = TYPE_STYLE[type];
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold",
        style.chip,
      ].join(" ")}
    >
      <span className={["h-1.5 w-1.5 rounded-full", style.dot].join(" ")} aria-hidden />
      {style.label}
    </span>
  );
}

function ProductTag({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-background-subtle px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-foreground-muted">
      {name}
    </span>
  );
}

function EntryMeta({ entry }: { entry: ReleaseEntry }) {
  if (!entry.caso && !entry.viewUrl) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-foreground-muted">
      {entry.caso ? <span className="font-mono uppercase">{entry.caso}</span> : null}
      {entry.viewUrl ? (
        <a
          href={entry.viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-foreground-brand underline-offset-4 hover:underline"
        >
          Ver no sistema
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Auxiliares de filtro                                                         */
/* -------------------------------------------------------------------------- */

function Chip({
  children,
  active,
  onClick,
  dotClass,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  dotClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150",
        active
          ? "border-brand-primary bg-brand-primary/12 text-[#036B77] shadow-[0_0_0_3px_rgba(0,160,177,0.10)]"
          : "border-border-subtle bg-background-elevated text-foreground-subtitle hover:border-border-strong hover:text-foreground",
      ].join(" ")}
    >
      {dotClass ? (
        <span className={["h-1.5 w-1.5 rounded-full", dotClass].join(" ")} aria-hidden />
      ) : null}
      {children}
    </button>
  );
}

function FilteredEmpty({ query, onReset }: { query: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-large border border-dashed border-border-default bg-background-elevated px-6 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background-subtle text-foreground-muted">
        <Search className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="text-[17px] font-semibold text-foreground-heading">
        Nada encontrado por aqui
      </h3>
      <p className="max-w-[46ch] text-[13.5px] leading-relaxed text-foreground-muted">
        {query
          ? `Nenhuma entrega corresponde a “${query}”. Tente outro termo ou veja tudo.`
          : "Nenhuma entrega corresponde aos filtros selecionados."}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded-regular border border-border-default px-4 py-2 text-[13.5px] font-medium text-foreground-subtitle transition-colors hover:border-brand-primary hover:text-brand-primary"
      >
        Ver todas as entregas
      </button>
    </div>
  );
}
