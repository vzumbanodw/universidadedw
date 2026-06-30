import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Beaker,
  Building2,
  ClipboardList,
  CreditCard,
  Factory,
  FileText,
  Headphones,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Progress } from "@/components/ui/Progress";
import { slugify } from "@/lib/admin/options";
import { cn } from "@/lib/utils";
import type { TrackCategory, TrackCategoryAccent, TrackCategoryIcon } from "@/types/tracks";

const ICONS: Record<TrackCategoryIcon, LucideIcon> = {
  chart: BarChart3,
  users: Users,
  flask: Beaker,
  clipboard: ClipboardList,
  "file-text": FileText,
  wallet: Wallet,
  building: Building2,
  headset: Headphones,
  "credit-card": CreditCard,
  factory: Factory,
};

type AccentStyle = {
  iconBg: string;
  iconText: string;
  ring: string;
  bar: "primary" | "orange" | "green" | "violet" | "info";
};

const ACCENTS: Record<TrackCategoryAccent, AccentStyle> = {
  teal: { iconBg: "bg-brand-primary/12", iconText: "text-brand-primary", ring: "group-hover:ring-brand-primary/30", bar: "primary" },
  navy: { iconBg: "bg-brand-secondary/12", iconText: "text-brand-secondary", ring: "group-hover:ring-brand-secondary/30", bar: "primary" },
  tertiary: { iconBg: "bg-brand-tertiary/12", iconText: "text-brand-tertiary", ring: "group-hover:ring-brand-tertiary/30", bar: "info" },
  orange: { iconBg: "bg-brand-orange/15", iconText: "text-[#B97A0F]", ring: "group-hover:ring-brand-orange/30", bar: "orange" },
  green: { iconBg: "bg-brand-green/20", iconText: "text-[#5C8A1F]", ring: "group-hover:ring-brand-green/30", bar: "green" },
  red: { iconBg: "bg-foreground-error/12", iconText: "text-foreground-error", ring: "group-hover:ring-foreground-error/30", bar: "orange" },
  violet: { iconBg: "bg-[#6C90FF]/12", iconText: "text-[#3B5CD8]", ring: "group-hover:ring-[#6C90FF]/30", bar: "violet" },
  info: { iconBg: "bg-foreground-information/12", iconText: "text-foreground-information", ring: "group-hover:ring-foreground-information/30", bar: "info" },
  neutral: { iconBg: "bg-foreground/8", iconText: "text-foreground-heading", ring: "group-hover:ring-foreground/20", bar: "primary" },
};

/** Slug de navegação da categoria — mesma regra da página de detalhe. */
export function trackCategorySlug(category: { name: string }): string {
  return slugify(category.name);
}

/**
 * Card de aplicação (1ª camada): compacto e elegante, sem capa. A imagem de
 * capa aparece no cabeçalho da aplicação ao entrar nela.
 */
export function TrackCategoryCard({ category }: { category: TrackCategory }) {
  const Icon = ICONS[category.iconKey];
  const accent = ACCENTS[category.accent];
  const href = `/dashboard/aplicacoes/${trackCategorySlug(category)}`;

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-4 rounded-medium border border-border-subtle bg-background-elevated p-5",
        "shadow-elevation-sm ring-1 ring-transparent transition-[box-shadow,transform,border-color] duration-200",
        "hover:-translate-y-0.5 hover:border-border-default hover:shadow-elevation-md",
        accent.ring,
      )}
    >
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-medium",
            accent.iconBg,
            accent.iconText,
          )}
        >
          <Icon className="h-[22px] w-[22px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-semibold tracking-tight text-foreground-heading">
            {category.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-foreground-muted">
            {category.tagline}
          </p>
        </div>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-foreground-muted opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
          aria-hidden
        />
      </div>

      <div className="flex items-center gap-3 text-[12px] text-foreground-subtitle">
        <Stat label="cursos" value={category.trackCount} />
        <Divider />
        <Stat label="aulas" value={category.lessonCount} />
        <Divider />
        <Stat label="concluídas" value={category.completed} muted />
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between text-[11.5px]">
          <span className="font-medium uppercase tracking-[0.12em] text-foreground-muted">
            Seu progresso
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {category.progressPct}%
          </span>
        </div>
        <Progress value={category.progressPct} tone={accent.bar} size="xs" />
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span
        className={cn(
          "text-[14px] font-semibold tabular-nums",
          muted ? "text-foreground-subtitle" : "text-foreground-heading",
        )}
      >
        {value}
      </span>
      <span className="text-foreground-muted">{label}</span>
    </span>
  );
}

function Divider() {
  return <span aria-hidden className="h-3 w-px bg-border-default" />;
}
