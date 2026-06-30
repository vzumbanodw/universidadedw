import type { Metadata } from "next";
import Link from "next/link";
import { Award, CheckCircle2, Clock, PlayCircle, type LucideIcon } from "lucide-react";
import { CertificateCard } from "@/components/certificates/CertificateCard";
import { mockCertificates } from "@/data/mock-certificates";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Certificados · Universidade",
  description:
    "Acompanhe certificados emitidos, disponíveis e em andamento na Universidade Dataweb.",
};

export default function CertificadosPage() {
  const summary = mockCertificates.reduce(
    (acc, certificate) => {
      if (certificate.status === "issued") acc.issued += 1;
      if (certificate.status === "in_progress") acc.inProgress += 1;
      if (certificate.status === "available") acc.available += 1;
      acc.minutes += certificate.estimatedMinutes;
      return acc;
    },
    { issued: 0, inProgress: 0, available: 0, minutes: 0 },
  );

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
            Certificações conectadas aos cursos concluídos e às próximas
            validações de conhecimento da equipe.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:w-auto lg:shrink-0">
          <SummaryTile icon={Award} label="Certificados" value={mockCertificates.length} />
          <SummaryTile icon={CheckCircle2} label="Emitidos" value={summary.issued} accent="green" />
          <SummaryTile icon={PlayCircle} label="Em andamento" value={summary.inProgress} accent="teal" />
          <SummaryTile icon={Clock} label="Minutos" value={summary.minutes} muted />
        </ul>
      </header>

      <section
        aria-label="Lista de certificados"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {mockCertificates.map((certificate) => (
          <CertificateCard key={certificate.id} certificate={certificate} />
        ))}
      </section>
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
    <li className="flex h-[58px] min-w-[128px] items-center gap-2.5 rounded-regular border border-border-subtle bg-background-elevated px-3 shadow-elevation-sm">
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
