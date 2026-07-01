import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { readContent } from "@/lib/content/store.server";
import { getStudentProgress } from "@/lib/content/progress.server";
import { getCurrentStudent } from "@/lib/auth/student";
import {
  applicationProgress,
  courseCompletion,
  videoLessons,
} from "@/lib/student-progress";
import { slugify } from "@/lib/admin/options";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Certificados · Universidade",
  description: "Certificados liberados ao concluir todos os vídeos de um curso.",
};

export const dynamic = "force-dynamic";

function slugOf(href: string, id: string): string {
  return href.split("/").filter(Boolean).at(-1) ?? id;
}

export default async function CertificadosPage() {
  const content = await readContent();
  const student = await getCurrentStudent();
  const rows = await getStudentProgress(student?.id);
  const progress = new Map(rows.map((r) => [r.lessonId, r.percent]));
  const dateByLesson = new Map(
    rows.filter((r) => r.completedAt).map((r) => [r.lessonId, r.completedAt as string]),
  );

  const certCourses = content.courses.filter((c) => c.published && c.certificate);
  const items = certCourses.map((course) => {
    const cc = courseCompletion(course.id, content.lessons, progress);
    const earned = cc.total > 0 && cc.done === cc.total;
    let earnedAt: string | undefined;
    if (earned) {
      const dates = videoLessons(content.lessons, course.id)
        .map((l) => dateByLesson.get(l.id))
        .filter((d): d is string => Boolean(d))
        .sort();
      earnedAt = dates.at(-1);
    }
    return { course, cc, earned, earnedAt, slug: slugOf(course.href, course.id) };
  });

  // Certificados de APLICAÇÃO: liberados quando TODOS os cursos da aplicação
  // são concluídos.
  const appItems = content.categories
    .filter((c) => c.published)
    .map((category) => {
      const ap = applicationProgress(
        category.id,
        content.courses,
        content.lessons,
        progress,
      );
      const won = ap.status === "completed" && ap.courseCount > 0;
      let earnedAt: string | undefined;
      if (won) {
        const appCourseIds = new Set(
          content.courses
            .filter((c) => c.published && c.categoryId === category.id)
            .map((c) => c.id),
        );
        const dates = content.lessons
          .filter((l) => l.published && l.videoUrl && appCourseIds.has(l.courseId))
          .map((l) => dateByLesson.get(l.id))
          .filter((d): d is string => Boolean(d))
          .sort();
        earnedAt = dates.at(-1);
      }
      return { category, ap, earned: won, earnedAt, slug: slugify(category.name) };
    })
    .filter((a) => a.ap.courseCount > 0);

  const totalItems = appItems.length + items.length;
  const earned =
    appItems.filter((a) => a.earned).length + items.filter((i) => i.earned).length;
  const started =
    appItems.filter((a) => !a.earned && a.ap.pct > 0).length +
    items.filter((i) => !i.earned && i.cc.done > 0).length;

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8">
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
            <span className="text-foreground-subtitle">Certificados</span>
          </nav>
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground-heading sm:text-[30px]">
            Certificados
          </h1>
          <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-foreground-subtitle">
            Conclua <strong className="font-semibold text-foreground">todos os
            cursos</strong> de uma aplicação — ou todos os vídeos de um curso com
            certificado — para liberar o seu certificado.
          </p>
        </div>

        <ul className="grid grid-cols-3 gap-2.5 lg:w-auto lg:shrink-0">
          <SummaryTile icon={Award} label="Disponíveis" value={totalItems} />
          <SummaryTile icon={CheckCircle2} label="Liberados" value={earned} accent="green" />
          <SummaryTile icon={Clock} label="Em andamento" value={started} accent="teal" />
        </ul>
      </header>

      {totalItems === 0 ? (
        <div className="rounded-medium border border-dashed border-border-default bg-background-elevated px-6 py-16 text-center">
          <Award className="mx-auto h-8 w-8 text-foreground-muted" aria-hidden />
          <p className="mt-3 text-[14px] text-foreground-muted">
            Nenhum certificado por enquanto. Conclua cursos e aplicações para
            liberar os seus certificados.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {appItems.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-foreground-muted">
                Certificados de aplicação
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {appItems.map((item) => (
                  <CertificateCard
                    key={item.category.id}
                    title={item.category.name}
                    category="Aplicação"
                    earned={item.earned}
                    pct={item.ap.pct}
                    earnedAt={item.earnedAt}
                    href={`/dashboard/certificados/aplicacao/${item.slug}`}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {items.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-foreground-muted">
                Certificados de curso
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <CertificateCard
                    key={item.course.id}
                    title={item.course.title}
                    category={item.course.categoryName}
                    earned={item.earned}
                    pct={item.cc.pct}
                    earnedAt={item.earnedAt}
                    href={`/dashboard/certificados/${item.slug}`}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function CertificateCard({
  title,
  category,
  earned,
  pct,
  earnedAt,
  href,
}: {
  title: string;
  category: string;
  earned: boolean;
  pct: number;
  earnedAt?: string;
  href: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-medium border border-border-subtle bg-background-elevated p-5 shadow-elevation-sm">
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-regular",
            earned
              ? "bg-brand-green/20 text-[#5C8A1F]"
              : "bg-background-subtle text-foreground-muted",
          )}
        >
          <Award className="h-5 w-5" />
        </span>
        {earned ? (
          <Badge variant="success" size="sm" dot>
            Disponível
          </Badge>
        ) : (
          <Badge variant="neutral" size="sm">
            {pct}% concluído
          </Badge>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-muted">
          {category}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-foreground-heading">
          {title}
        </h3>
      </div>

      {earned ? (
        <div className="mt-auto flex flex-col gap-2">
          {earnedAt ? (
            <p className="text-[12px] text-foreground-muted">
              Concluído em {formatDate(earnedAt)}
            </p>
          ) : null}
          <Link
            href={href}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-regular bg-button-primary px-4 text-sm font-medium text-white shadow-elevation-sm transition-colors hover:bg-brand-dark"
          >
            <Download className="h-4 w-4" aria-hidden />
            Baixar certificado
          </Link>
        </div>
      ) : (
        <div className="mt-auto flex flex-col gap-2">
          <Progress value={pct} tone="primary" size="xs" />
          <p className="inline-flex items-center gap-1.5 text-[12px] text-foreground-muted">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Conclua todos os vídeos para liberar
          </p>
        </div>
      )}
    </div>
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
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  accent?: keyof typeof TILE_ACCENTS;
}) {
  const iconStyle = accent ? TILE_ACCENTS[accent] : TILE_ACCENTS.default;
  return (
    <li className="flex h-[58px] min-w-[110px] items-center gap-2.5 rounded-regular border border-border-subtle bg-background-elevated px-3 shadow-elevation-sm">
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
        <p className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-foreground-muted">
          {label}
        </p>
        <p className="text-[17px] font-semibold leading-none tabular-nums text-foreground-heading">
          {value}
        </p>
      </div>
    </li>
  );
}
