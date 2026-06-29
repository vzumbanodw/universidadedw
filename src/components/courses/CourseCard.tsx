import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Clock,
  PlayCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";
import { formatMinutes } from "@/lib/formatters";
import type { Course, CourseFormat } from "@/types/courses";
import type { LearningLevel, LearningPathStatus } from "@/types/learning";
import type { TrackCategoryAccent } from "@/types/tracks";

const ACCENTS: Record<
  TrackCategoryAccent,
  {
    cover: string;
    icon: string;
    ring: string;
  }
> = {
  teal: {
    cover: "from-brand-primary/22 via-brand-primary/6 to-transparent",
    icon: "bg-brand-primary/12 text-brand-primary",
    ring: "group-hover:ring-brand-primary/30",
  },
  navy: {
    cover: "from-brand-secondary/25 via-brand-secondary/6 to-transparent",
    icon: "bg-brand-secondary/12 text-brand-secondary",
    ring: "group-hover:ring-brand-secondary/30",
  },
  tertiary: {
    cover: "from-brand-tertiary/24 via-brand-tertiary/6 to-transparent",
    icon: "bg-brand-tertiary/12 text-brand-tertiary",
    ring: "group-hover:ring-brand-tertiary/30",
  },
  orange: {
    cover: "from-brand-orange/24 via-brand-orange/7 to-transparent",
    icon: "bg-brand-orange/15 text-[#B97A0F]",
    ring: "group-hover:ring-brand-orange/30",
  },
  green: {
    cover: "from-brand-green/24 via-brand-green/7 to-transparent",
    icon: "bg-brand-green/20 text-[#5C8A1F]",
    ring: "group-hover:ring-brand-green/30",
  },
  red: {
    cover: "from-foreground-error/18 via-foreground-error/5 to-transparent",
    icon: "bg-foreground-error/12 text-foreground-error",
    ring: "group-hover:ring-foreground-error/30",
  },
  violet: {
    cover: "from-[#6C90FF]/22 via-[#6C90FF]/6 to-transparent",
    icon: "bg-[#6C90FF]/12 text-[#9BB5FF]",
    ring: "group-hover:ring-[#6C90FF]/30",
  },
  info: {
    cover: "from-foreground-information/20 via-foreground-information/5 to-transparent",
    icon: "bg-foreground-information/12 text-foreground-information",
    ring: "group-hover:ring-foreground-information/30",
  },
  neutral: {
    cover: "from-foreground/10 via-foreground/3 to-transparent",
    icon: "bg-foreground/8 text-foreground-heading",
    ring: "group-hover:ring-foreground/20",
  },
};

const LEVEL_VARIANT: Record<LearningLevel, "success" | "info" | "warning"> = {
  Iniciante: "success",
  Intermediário: "info",
  Avançado: "warning",
};

const STATUS_LABEL: Record<LearningPathStatus, string> = {
  completed: "Concluído",
  in_progress: "Em andamento",
  not_started: "Novo",
};

const STATUS_VARIANT: Record<
  LearningPathStatus,
  "success" | "orange" | "neutral"
> = {
  completed: "success",
  in_progress: "orange",
  not_started: "neutral",
};

const FORMAT_ICON: Record<CourseFormat, LucideIcon> = {
  Videoaulas: PlayCircle,
  Prático: BookOpen,
  "Ao vivo": Sparkles,
  Certificação: Award,
};

export function CourseCard({ course }: { course: Course }) {
  const accent = ACCENTS[course.accent];
  const FormatIcon = FORMAT_ICON[course.format];
  const showProgress = course.status === "in_progress";

  return (
    <Link
      href={course.href}
      className={cn(
        "group flex min-h-[320px] flex-col overflow-hidden rounded-medium border border-border-subtle bg-background-elevated",
        "shadow-elevation-sm ring-1 ring-transparent transition-[border-color,box-shadow,transform] duration-200",
        "hover:-translate-y-0.5 hover:border-border-default hover:shadow-elevation-md",
        accent.ring,
      )}
    >
      <div className={cn("relative h-[118px] overflow-hidden bg-gradient-to-br", accent.cover)}>
        {course.coverImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={course.coverImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent"
            />
          </>
        ) : (
          <div aria-hidden className="absolute inset-0 bg-grid-pattern-subtle opacity-60" />
        )}
        <div className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap gap-1.5">
          {course.featured ? (
            <Badge variant="orange" size="sm">
              <Sparkles className="h-2.5 w-2.5" aria-hidden />
              Destaque
            </Badge>
          ) : null}
          <Badge variant={LEVEL_VARIANT[course.level]} size="sm">
            {course.level}
          </Badge>
          <Badge variant={STATUS_VARIANT[course.status]} size="sm" dot>
            {STATUS_LABEL[course.status]}
          </Badge>
        </div>
        <span
          aria-hidden
          className={cn(
            "absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-regular border border-white/50 shadow-elevation-sm backdrop-blur-sm",
            accent.icon,
          )}
        >
          <FormatIcon className="h-[18px] w-[18px]" />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-muted">
            {course.categoryName} · {course.format}
          </p>
          <h3 className="mt-1 line-clamp-2 text-[16px] font-semibold leading-snug tracking-tight text-foreground-heading">
            {course.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-foreground-muted">
            {course.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-foreground-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {formatMinutes(course.estimatedMinutes)}
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            {course.lessonsCount} aulas
          </span>
          {course.certificate ? (
            <span className="inline-flex items-center gap-1">
              <Award className="h-3.5 w-3.5" aria-hidden />
              Certificado
            </span>
          ) : null}
        </div>

        <div className="mt-auto">
          {showProgress ? (
            <Progress
              value={course.progress}
              tone="primary"
              size="xs"
              label={`${course.progress}% concluído`}
            />
          ) : (
            <div className="inline-flex w-full items-center justify-between rounded-small bg-surface-muted/50 px-2.5 py-2 text-[12px] text-foreground-subtitle">
              <span>
                {course.status === "completed" ? "Revisar curso" : "Começar curso"}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-foreground-muted" aria-hidden />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
