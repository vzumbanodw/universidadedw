import type { Metadata } from "next";
import Link from "next/link";
import {
  Boxes,
  CheckCircle2,
  Compass,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";
import {
  TracksBrowser,
  type TrackCategoryWithStatus,
} from "@/components/tracks/TracksBrowser";
import { readContent } from "@/lib/content/store.server";
import { getStudentCompletions } from "@/lib/content/progress.server";
import { getCurrentStudent } from "@/lib/auth/student";
import {
  applicationProgress,
  categoryWithRealProgress,
} from "@/lib/student-progress";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Trilhas · Universidade",
  description:
    "Trilhas de aprendizado organizadas por aplicação da plataforma Dataweb.",
};

export const dynamic = "force-dynamic";

export default async function TrilhasPage() {
  const content = await readContent();
  const student = await getCurrentStudent();
  const completions = await getStudentCompletions(student?.id);
  const completedSet = new Set(completions.map((c) => c.lessonId));

  const published = content.categories.filter((c) => c.published);
  const categories: TrackCategoryWithStatus[] = published.map((c) => {
    const withProgress = categoryWithRealProgress(
      c,
      content.courses,
      content.lessons,
      completedSet,
    );
    const { status } = applicationProgress(
      c.id,
      content.courses,
      content.lessons,
      completedSet,
    );
    return { ...withProgress, status };
  });

  const summary: Summary = {
    tracks: published.reduce((acc, c) => acc + c.trackCount, 0),
    lessons: published.reduce((acc, c) => acc + c.lessonCount, 0),
    inProgress: categories.filter((c) => c.status === "in_progress").length,
    completed: categories.filter((c) => c.status === "completed").length,
  };

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8">
      <PageHeader summary={summary} />

      <TracksBrowser categories={categories} />
    </div>
  );
}

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
        <nav
          aria-label="Breadcrumb"
          className="mb-2 flex items-center gap-1.5 text-[12px] text-foreground-muted"
        >
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
          Trilhas de aprendizado organizadas por{" "}
          <strong className="font-semibold text-foreground">aplicação</strong> da
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
