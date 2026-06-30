import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";
import { CoursesBrowser } from "@/components/courses/CoursesBrowser";
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

      <CoursesBrowser courses={published} />
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

