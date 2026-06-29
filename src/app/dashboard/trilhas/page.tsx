import type { Metadata } from "next";
import Link from "next/link";
import {
  Boxes,
  CheckCircle2,
  Compass,
  Filter,
  PlayCircle,
  Search,
  type LucideIcon,
} from "lucide-react";
import { TrackCategoriesSection } from "@/components/tracks/TrackCategoriesSection";
import { readContent } from "@/lib/content/store.server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Trilhas · Universidade",
  description:
    "Trilhas de aprendizado organizadas por aplicação da plataforma Dataweb.",
};

export const dynamic = "force-dynamic";

export default async function TrilhasPage() {
  const content = await readContent();
  const published = content.categories.filter((c) => c.published);

  const summary = published.reduce(
    (acc, c) => {
      acc.tracks += c.trackCount;
      acc.lessons += c.lessonCount;
      acc.inProgress += c.inProgress;
      acc.completed += c.completed;
      return acc;
    },
    { tracks: 0, lessons: 0, inProgress: 0, completed: 0 },
  );

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8">
      <PageHeader summary={summary} />

      <FilterBar />

      <TrackCategoriesSection
        eyebrow="Aplicações"
        title="Trilhas por aplicação"
        description="Domine cada aplicação da plataforma na ordem certa, do primeiro acesso até a operação avançada."
        categories={published}
      />
    </div>
  );
}

/* ---------------------------------- Header --------------------------------- */

type Summary = {
  tracks: number;
  lessons: number;
  inProgress: number;
  completed: number;
};

function PageHeader({ summary }: { summary: Summary }) {
  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-[12px] text-foreground-muted">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground-subtitle">Trilhas</span>
        </nav>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground-heading sm:text-[30px]">
          Trilhas
        </h1>
        <p className="mt-2 max-w-[60ch] text-[14px] leading-relaxed text-foreground-subtitle">
          Trilhas de aprendizado organizadas por <strong className="font-semibold text-foreground">aplicação</strong> da
          plataforma. Escolha o caminho que faz sentido para o seu papel hoje.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:w-auto lg:shrink-0">
        <SummaryTile icon={Compass} label="Trilhas" value={summary.tracks} />
        <SummaryTile icon={Boxes} label="Aulas" value={summary.lessons} muted />
        <SummaryTile
          icon={PlayCircle}
          label="Em andamento"
          value={summary.inProgress}
          accent="orange"
        />
        <SummaryTile
          icon={CheckCircle2}
          label="Concluídas"
          value={summary.completed}
          accent="green"
        />
      </ul>
    </header>
  );
}

const TILE_ACCENTS = {
  default: "bg-background-subtle text-foreground-subtitle",
  orange: "bg-brand-orange/15 text-[#B97A0F]",
  green: "bg-brand-green/20 text-[#5C8A1F]",
} as const;

function SummaryTile({
  icon: Icon,
  label,
  value,
  muted = false,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  muted?: boolean;
  accent?: keyof typeof TILE_ACCENTS;
}) {
  const iconStyle = accent ? TILE_ACCENTS[accent] : TILE_ACCENTS.default;
  return (
    <li
      className={cn(
        "flex h-[58px] min-w-[128px] items-center gap-2.5 rounded-regular",
        "border border-border-subtle bg-background-elevated px-3 shadow-elevation-sm",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-small",
          iconStyle,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          title={label}
          className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-foreground-muted"
        >
          {label}
        </p>
        <p
          className={cn(
            "text-[17px] font-semibold leading-none tabular-nums",
            muted ? "text-foreground-subtitle" : "text-foreground-heading",
          )}
        >
          {value}
        </p>
      </div>
    </li>
  );
}

/* --------------------------------- Filter bar ------------------------------ */

function FilterBar() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex h-10 flex-1 items-center rounded-regular border border-border-subtle bg-background-elevated transition-colors focus-within:border-foreground-subtitle">
        <Search aria-hidden className="ml-3 h-4 w-4 text-foreground-muted" />
        <input
          type="search"
          aria-label="Buscar trilhas"
          placeholder="Buscar trilhas ou aplicações…"
          className="flex-1 bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-foreground-muted outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <FilterPill active>Todas</FilterPill>
        <FilterPill>Em andamento</FilterPill>
        <FilterPill>Concluídas</FilterPill>
        <button
          type="button"
          aria-label="Mais filtros"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-regular border border-border-subtle bg-background-elevated text-foreground-muted transition-colors hover:border-border-default hover:text-foreground"
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function FilterPill({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 items-center rounded-regular px-3.5 text-[13px] font-medium transition-colors",
        active
          ? "border border-foreground-heading bg-foreground-heading text-background-elevated"
          : "border border-border-subtle bg-background-elevated text-foreground-subtitle hover:border-border-default hover:bg-background-subtle hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}