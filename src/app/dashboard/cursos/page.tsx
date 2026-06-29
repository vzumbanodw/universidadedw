import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Filter,
  PlayCircle,
  Search,
  type LucideIcon,
} from "lucide-react";
import { CoursesSection } from "@/components/courses/CoursesSection";
import { readContent } from "@/lib/content/store.server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cursos · Universidade",
  description:
    "Cursos práticos da Universidade Dataweb organizados por aplicação.",
};

export const dynamic = "force-dynamic";

export default async function CursosPage() {
  const content = await readContent();
  const published = content.courses.filter((c) => c.published);

  const summary = published.reduce(
    (acc, course) => {
      acc.courses += 1;
      acc.lessons += course.lessonsCount;
      if (course.status === "in_progress") acc.inProgress += 1;
      if (course.status === "completed") acc.completed += 1;
      if (course.certificate) acc.certificates += 1;
      return acc;
    },
    { courses: 0, lessons: 0, inProgress: 0, completed: 0, certificates: 0 },
  );

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8">
      <PageHeader summary={summary} />

      <FilterBar />

      <FeaturedStrip />

      <CoursesSection
        eyebrow="Aplicações"
        title="Cursos por aplicação"
        description="Aprofunde o uso das aplicações da plataforma com cursos objetivos e orientados à rotina."
        courses={published}
      />
    </div>
  );
}

type Summary = {
  courses: number;
  lessons: number;
  inProgress: number;
  completed: number;
  certificates: number;
};

function PageHeader({ summary }: { summary: Summary }) {
  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <nav
          aria-label="Breadcrumb"
          className="mb-2 flex items-center gap-1.5 text-[12px] text-foreground-muted"
        >
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground-subtitle">Cursos</span>
        </nav>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground-heading sm:text-[30px]">
          Cursos
        </h1>
        <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-foreground-subtitle">
          Cursos rápidos e práticos conectados às mesmas{" "}
          <strong className="font-semibold text-foreground">aplicações</strong>{" "}
          das suas trilhas. Use para reforçar uma habilidade específica ou
          acelerar uma entrega do time.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:w-auto lg:shrink-0">
        <SummaryTile icon={BookOpen} label="Cursos" value={summary.courses} />
        <SummaryTile icon={PlayCircle} label="Aulas" value={summary.lessons} muted />
        <SummaryTile
          icon={Award}
          label="Certificados"
          value={summary.certificates}
          accent="teal"
        />
        <SummaryTile
          icon={CheckCircle2}
          label="Concluídos"
          value={summary.completed}
          accent="green"
        />
      </ul>
    </header>
  );
}

const TILE_ACCENTS = {
  default: "bg-background-subtle text-foreground-subtitle",
  teal: "bg-brand-primary/12 text-brand-primary",
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

function FilterBar() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex h-10 flex-1 items-center rounded-regular border border-border-subtle bg-background-elevated transition-colors focus-within:border-foreground-subtitle">
        <Search aria-hidden className="ml-3 h-4 w-4 text-foreground-muted" />
        <input
          type="search"
          aria-label="Buscar cursos"
          placeholder="Buscar cursos ou aplicações..."
          className="flex-1 bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-foreground-muted outline-none"
        />
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:overflow-visible sm:pb-0">
        <FilterPill active>Todos</FilterPill>
        <FilterPill>Em andamento</FilterPill>
        <FilterPill>Certificação</FilterPill>
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

function FeaturedStrip() {
  return (
    <section
      aria-label="Atalhos de cursos"
      className="grid grid-cols-1 gap-3 lg:grid-cols-3"
    >
      <ShortcutCard
        icon={PlayCircle}
        title="Continuar de onde parou"
        description="Retome cursos em andamento nas aplicações que você já usa."
        href="/dashboard/cursos?status=em-andamento"
      />
      <ShortcutCard
        icon={Award}
        title="Cursos com certificado"
        description="Priorize conteúdos que geram comprovação para você e sua equipe."
        href="/dashboard/cursos?certificado=true"
      />
      <ShortcutCard
        icon={BookOpen}
        title="Começar por uma aplicação"
        description="Escolha CRM, Analytics, Dilab, OptFacil ou PDF como ponto de partida."
        href="/dashboard/cursos?tipo=aplicacoes"
      />
    </section>
  );
}

function ShortcutCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-medium border border-border-subtle bg-background-elevated p-4 shadow-elevation-sm transition-[border-color,background-color,box-shadow] hover:border-border-default hover:bg-surface-elevated hover:shadow-elevation-md"
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-regular bg-brand-primary/12 text-brand-primary"
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold tracking-tight text-foreground-heading">
          {title}
        </span>
        <span className="mt-1 block text-[12.5px] leading-relaxed text-foreground-muted">
          {description}
        </span>
      </span>
    </Link>
  );
}

