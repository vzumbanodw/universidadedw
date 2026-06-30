import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  Layers,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";
import { readContent } from "@/lib/content/store.server";
import { getCurrentStudent } from "@/lib/auth/student";
import { cn } from "@/lib/utils";
import type {
  AdminCategory,
  AdminCourse,
  IssuedCertificate,
} from "@/types/admin";

export const metadata: Metadata = {
  title: "Universidade Dataweb",
  description: "Acesse trilhas, cursos e certificados da Universidade Dataweb.",
};

// Conteúdo é gerenciado pelo backoffice e lido em tempo real do servidor.
export const dynamic = "force-dynamic";

type FeatureAccent = "teal" | "orange" | "green";

type Feature = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: FeatureAccent;
  stats: { label: string; value: number }[];
};

function buildFeatures(
  categories: AdminCategory[],
  courses: AdminCourse[],
  certificates: IssuedCertificate[],
): Feature[] {
  return [
    {
      title: "Trilhas",
      description:
        "Caminhos de aprendizado por aplicação, com progresso claro para cada área.",
      href: "/dashboard/trilhas",
      icon: Compass,
      accent: "teal",
      stats: [
        {
          label: "trilhas",
          value: categories.reduce((sum, item) => sum + item.trackCount, 0),
        },
        {
          label: "em andamento",
          value: categories.reduce((sum, item) => sum + item.inProgress, 0),
        },
      ],
    },
    {
      title: "Cursos",
      description:
        "Aulas práticas para dominar fluxos específicos e avançar no uso da plataforma.",
      href: "/dashboard/cursos",
      icon: BookOpen,
      accent: "orange",
      stats: [
        { label: "cursos", value: courses.length },
        {
          label: "concluídos",
          value: courses.filter((course) => course.status === "completed").length,
        },
      ],
    },
    {
      title: "Certificados",
      description:
        "Certificações emitidas, disponíveis e em progresso a partir dos cursos concluídos.",
      href: "/dashboard/certificados",
      icon: Award,
      accent: "green",
      stats: [
        { label: "certificados", value: certificates.length },
        {
          label: "emitidos",
          value: certificates.filter((cert) => cert.status === "issued").length,
        },
      ],
    },
  ];
}

export default async function DashboardPage() {
  const content = await readContent();
  const student = await getCurrentStudent();
  const categories = content.categories.filter((c) => c.published);
  const courses = content.courses.filter((c) => c.published);
  const certificates = student
    ? content.certificates.filter(
        (c) => c.studentEmail.toLowerCase() === student.email.toLowerCase(),
      )
    : [];

  const features = buildFeatures(categories, courses, certificates);

  const completedCourses = courses.filter(
    (course) => course.status === "completed",
  ).length;
  const issuedCertificates = certificates.filter(
    (certificate) => certificate.status === "issued",
  ).length;
  const activeTracks = categories.reduce(
    (sum, category) => sum + category.inProgress,
    0,
  );

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-8">
      <header className="flex flex-col gap-4">
        <span className="inline-flex w-fit items-center rounded-full border border-border-subtle bg-background-elevated px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-muted">
          Universidade Dataweb
        </span>
        <div className="max-w-[760px]">
          <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-foreground-heading sm:text-[38px]">
            Aprendizado focado em trilhas, cursos e certificados.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-subtitle">
            Uma experiência direta para escolher o caminho, estudar o conteúdo e
            comprovar evolução.
          </p>
        </div>
      </header>

      <section
        aria-label="Resumo da Universidade"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        <Metric icon={Layers} label="Trilhas em andamento" value={activeTracks} />
        <Metric icon={CheckCircle2} label="Cursos concluídos" value={completedCourses} />
        <Metric icon={Award} label="Certificados emitidos" value={issuedCertificates} />
      </section>

      <section
        aria-label="Funcionalidades principais"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        {features.map((feature) => (
          <FeatureCard key={feature.href} feature={feature} />
        ))}
      </section>
    </div>
  );
}

const FEATURE_ACCENTS = {
  teal: {
    icon: "bg-brand-primary/12 text-brand-primary",
    surface: "from-brand-primary/12 via-brand-primary/4 to-transparent",
  },
  orange: {
    icon: "bg-brand-orange/15 text-[#B97A0F]",
    surface: "from-brand-orange/16 via-brand-orange/5 to-transparent",
  },
  green: {
    icon: "bg-brand-green/20 text-[#5C8A1F]",
    surface: "from-brand-green/18 via-brand-green/5 to-transparent",
  },
} as const;

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  const accent = FEATURE_ACCENTS[feature.accent];

  return (
    <Link
      href={feature.href}
      className="group flex min-h-[276px] flex-col overflow-hidden rounded-medium border border-border-subtle bg-background-elevated shadow-elevation-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-border-default hover:shadow-elevation-md"
    >
      <div className={cn("relative h-24 bg-gradient-to-br", accent.surface)}>
        <div aria-hidden className="absolute inset-0 bg-grid-pattern-subtle opacity-50" />
        <span
          aria-hidden
          className={cn(
            "absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-regular border border-white/60 shadow-elevation-sm backdrop-blur-sm",
            accent.icon,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-[19px] font-semibold tracking-tight text-foreground-heading">
          {feature.title}
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-foreground-muted">
          {feature.description}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {feature.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-regular border border-border-subtle bg-background-subtle px-3 py-2"
            >
              <p className="text-[18px] font-semibold tabular-nums text-foreground-heading">
                {stat.value}
              </p>
              <p className="text-[11px] text-foreground-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <span className="mt-auto inline-flex items-center gap-1 pt-5 text-[13px] font-medium text-foreground-brand">
          Acessar {feature.title.toLowerCase()}
          <PlayCircle className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-regular border border-border-subtle bg-background-elevated px-4 py-3 shadow-elevation-sm">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-small bg-background-subtle text-foreground-subtitle"
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[20px] font-semibold leading-none tabular-nums text-foreground-heading">
          {value}
        </p>
        <p className="mt-1 truncate text-[12px] text-foreground-muted">{label}</p>
      </div>
    </div>
  );
}
