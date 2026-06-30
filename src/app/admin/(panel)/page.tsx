"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Layers,
  BookOpen,
  PlayCircle,
  Building2,
  GraduationCap,
  Award,
  TrendingUp,
  BarChart3,
  Settings,
  Megaphone,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { StatTile, Panel } from "@/components/admin/AdminPrimitives";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { useAdminStore } from "@/lib/admin/store";
import { deriveStudentProgress, maturityForPoints } from "@/lib/admin/progress";
import { accentToBadge } from "@/lib/admin/badge";

export default function AdminOverviewPage() {
  const store = useAdminStore();

  const metrics = useMemo(() => {
    const publishedCourses = store.courses.filter((c) => c.published).length;
    const draftCourses = store.courses.length - publishedCourses;
    const applications = store.categories.length;
    const issuedCertificates = store.certificates.filter(
      (c) => c.status === "issued",
    ).length;

    const pointsPerCourse = store.settings.points.pointsPerCourseCompletion;
    const progresses = store.members.map((m) =>
      deriveStudentProgress(m, store.courses, pointsPerCourse),
    );
    const avgProgress =
      progresses.length > 0
        ? Math.round(
            progresses.reduce((s, p) => s + p.overallProgress, 0) /
              progresses.length,
          )
        : 0;

    return {
      publishedCourses,
      draftCourses,
      applications,
      issuedCertificates,
      avgProgress,
      progresses,
    };
  }, [store.courses, store.categories, store.certificates, store.members, store.settings]);

  // Cursos com melhor/pior conclusão (a partir do progresso derivado dos alunos).
  const courseConclusion = useMemo(() => {
    const pointsPerCourse = store.settings.points.pointsPerCourseCompletion;
    const stats = store.courses
      .filter((c) => c.published)
      .map((course) => {
        let completed = 0;
        let started = 0;
        store.members.forEach((m) => {
          const p = deriveStudentProgress(m, store.courses, pointsPerCourse);
          if (p.completedCourseIds.includes(course.id)) completed += 1;
          if (p.startedCourseIds.includes(course.id)) started += 1;
        });
        const rate = started > 0 ? Math.round((completed / started) * 100) : 0;
        return { course, completed, started, rate };
      })
      .filter((s) => s.started > 0)
      .sort((a, b) => b.rate - a.rate);
    return { top: stats.slice(0, 3), low: [...stats].reverse().slice(0, 3) };
  }, [store.courses, store.members, store.settings]);

  const maturityDistribution = useMemo(() => {
    const pointsPerCourse = store.settings.points.pointsPerCourseCompletion;
    const counts = new Map<string, number>();
    store.members.forEach((m) => {
      const p = deriveStudentProgress(m, store.courses, pointsPerCourse);
      const level = maturityForPoints(p.totalPoints, store.maturityLevels);
      if (level) counts.set(level.id, (counts.get(level.id) ?? 0) + 1);
    });
    return [...store.maturityLevels]
      .sort((a, b) => a.order - b.order)
      .map((level) => ({ level, count: counts.get(level.id) ?? 0 }));
  }, [store.members, store.courses, store.maturityLevels, store.settings]);

  const shortcuts: {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    accent: "teal" | "orange" | "green" | "violet";
  }[] = [
    {
      title: "Cursos & Aulas",
      description:
        "Publique cursos com capa, vídeo e aulas, vinculados a cada aplicação.",
      href: "/admin/cursos",
      icon: BookOpen,
      accent: "orange",
    },
    {
      title: "Aplicações",
      description:
        "Organize os cursos por aplicação. Cada aplicação reúne seus cursos e aulas.",
      href: "/admin/categorias",
      icon: Layers,
      accent: "teal",
    },
    {
      title: "Alunos & Progresso",
      description:
        "Acompanhe progresso, pontuação, maturidade e certificados de cada cliente.",
      href: "/admin/alunos",
      icon: GraduationCap,
      accent: "green",
    },
    {
      title: "Relatórios",
      description:
        "Conclusão por curso, alunos mais ativos, evolução de pontuação e mais.",
      href: "/admin/relatorios",
      icon: BarChart3,
      accent: "violet",
    },
  ];

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-8">
      <header className="flex flex-col gap-4">
        <span className="inline-flex w-fit items-center rounded-full border border-border-subtle bg-background-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-muted">
          Backoffice
        </span>
        <div className="max-w-[760px]">
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground-heading sm:text-[34px]">
            Gestão da Universidade Dataweb
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-subtitle">
            Visão geral do conteúdo, dos alunos e da evolução da Universidade —
            tudo num só lugar.
          </p>
        </div>
      </header>

      {/* Indicadores principais */}
      <section
        aria-label="Indicadores gerais"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        <StatTile icon={BookOpen} label="Cursos publicados" value={metrics.publishedCourses} />
        <StatTile icon={Layers} label="Cursos em rascunho" value={metrics.draftCourses} />
        <StatTile icon={PlayCircle} label="Aulas" value={store.lessons.length} />
        <StatTile icon={Layers} label="Aplicações" value={metrics.applications} />
        <StatTile icon={Building2} label="Empresas" value={store.companies.length} />
        <StatTile icon={GraduationCap} label="Alunos" value={store.members.length} />
        <StatTile icon={Award} label="Certificados emitidos" value={metrics.issuedCertificates} />
        <StatTile icon={TrendingUp} label="Progresso médio" value={`${metrics.avgProgress}%`} />
      </section>

      {/* Conclusão por curso + maturidade */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
              Cursos com melhor conclusão
            </h2>
            <Link
              href="/admin/relatorios"
              className="text-[12.5px] font-medium text-foreground-brand hover:underline"
            >
              Ver relatórios
            </Link>
          </div>
          {courseConclusion.top.length === 0 ? (
            <p className="text-[13px] text-foreground-muted">
              Sem dados de conclusão ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {courseConclusion.top.map(({ course, rate, completed, started }) => (
                <li key={course.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-[13.5px] font-medium text-foreground-heading">
                      {course.title}
                    </span>
                    <span className="shrink-0 text-[12px] tabular-nums text-foreground-muted">
                      {completed}/{started} · {rate}%
                    </span>
                  </div>
                  <Progress value={rate} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="flex flex-col gap-4 p-5">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
            Distribuição de maturidade
          </h2>
          {maturityDistribution.every((m) => m.count === 0) ? (
            <p className="text-[13px] text-foreground-muted">
              Configure os níveis em Configurações para acompanhar a maturidade.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {maturityDistribution.map(({ level, count }) => (
                <li key={level.id} className="flex items-center justify-between gap-3">
                  <Badge variant={accentToBadge(level.accent)} size="sm" dot>
                    {level.name}
                  </Badge>
                  <span className="text-[13px] font-semibold tabular-nums text-foreground-heading">
                    {count} aluno{count === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      {/* Atalhos */}
      <section
        aria-label="Atalhos de gestão"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {shortcuts.map((shortcut) => (
          <ShortcutCard key={shortcut.href} {...shortcut} />
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-2 text-[12.5px] text-foreground-muted">
        <Megaphone className="h-3.5 w-3.5" aria-hidden />
        <Link href="/admin/updates" className="hover:text-foreground">
          {store.releaseNotes.length} nota(s) de versão
        </Link>
        <span aria-hidden>·</span>
        <Settings className="h-3.5 w-3.5" aria-hidden />
        <Link href="/admin/configuracoes" className="hover:text-foreground">
          Configurar pontuação e certificados
        </Link>
      </section>
    </div>
  );
}

const ACCENTS = {
  teal: {
    gradient: "from-brand-primary/12 via-brand-primary/4 to-transparent",
    icon: "bg-brand-primary/12 text-brand-primary",
  },
  orange: {
    gradient: "from-brand-orange/16 via-brand-orange/5 to-transparent",
    icon: "bg-brand-orange/15 text-[#B97A0F]",
  },
  green: {
    gradient: "from-brand-green/18 via-brand-green/5 to-transparent",
    icon: "bg-brand-green/20 text-[#5C8A1F]",
  },
  violet: {
    gradient: "from-[#6C90FF]/16 via-[#6C90FF]/5 to-transparent",
    icon: "bg-[#6C90FF]/12 text-[#3B5CD8]",
  },
} as const;

function ShortcutCard({
  title,
  description,
  href,
  icon: Icon,
  accent,
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: keyof typeof ACCENTS;
}) {
  const { gradient, icon } = ACCENTS[accent];

  return (
    <Link
      href={href}
      className="group flex min-h-[210px] flex-col overflow-hidden rounded-medium border border-border-subtle bg-background-elevated shadow-elevation-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-border-default hover:shadow-elevation-md"
    >
      <div className={`relative h-20 bg-gradient-to-br ${gradient}`}>
        <div aria-hidden className="absolute inset-0 bg-grid-pattern-subtle opacity-50" />
        <span
          aria-hidden
          className={`absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-regular border border-white/60 shadow-elevation-sm backdrop-blur-sm ${icon}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-[17px] font-semibold tracking-tight text-foreground-heading">
          {title}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-foreground-muted">
          {description}
        </p>
        <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[13px] font-medium text-foreground-brand">
          Gerenciar
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
