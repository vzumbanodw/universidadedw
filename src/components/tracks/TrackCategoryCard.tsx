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
  coverGradient: string;
  ring: string;
};

const ACCENTS: Record<TrackCategoryAccent, AccentStyle> = {
  teal: {
    iconBg: "bg-brand-primary/12",
    iconText: "text-brand-primary",
    coverGradient: "from-brand-primary/14 via-brand-primary/4 to-transparent",
    ring: "group-hover:ring-brand-primary/30",
  },
  navy: {
    iconBg: "bg-brand-secondary/12",
    iconText: "text-brand-secondary",
    coverGradient: "from-brand-secondary/16 via-brand-secondary/4 to-transparent",
    ring: "group-hover:ring-brand-secondary/30",
  },
  tertiary: {
    iconBg: "bg-brand-tertiary/12",
    iconText: "text-brand-tertiary",
    coverGradient: "from-brand-tertiary/14 via-brand-tertiary/4 to-transparent",
    ring: "group-hover:ring-brand-tertiary/30",
  },
  orange: {
    iconBg: "bg-brand-orange/15",
    iconText: "text-[#B97A0F]",
    coverGradient: "from-brand-orange/18 via-brand-orange/5 to-transparent",
    ring: "group-hover:ring-brand-orange/30",
  },
  green: {
    iconBg: "bg-brand-green/20",
    iconText: "text-[#5C8A1F]",
    coverGradient: "from-brand-green/22 via-brand-green/5 to-transparent",
    ring: "group-hover:ring-brand-green/30",
  },
  red: {
    iconBg: "bg-foreground-error/12",
    iconText: "text-foreground-error",
    coverGradient: "from-foreground-error/14 via-foreground-error/4 to-transparent",
    ring: "group-hover:ring-foreground-error/30",
  },
  violet: {
    iconBg: "bg-[#6C90FF]/12",
    iconText: "text-[#3B5CD8]",
    coverGradient: "from-[#6C90FF]/16 via-[#6C90FF]/4 to-transparent",
    ring: "group-hover:ring-[#6C90FF]/30",
  },
  info: {
    iconBg: "bg-foreground-information/12",
    iconText: "text-foreground-information",
    coverGradient: "from-foreground-information/14 via-foreground-information/4 to-transparent",
    ring: "group-hover:ring-foreground-information/30",
  },
  neutral: {
    iconBg: "bg-foreground/8",
    iconText: "text-foreground-heading",
    coverGradient: "from-foreground/8 via-foreground/2 to-transparent",
    ring: "group-hover:ring-foreground/20",
  },
};

/** Slug de navegação da categoria — mesma regra usada na página de detalhe. */
export function trackCategorySlug(category: { name: string }): string {
  return slugify(category.name);
}

/**
 * Card de aplicação/módulo em formato pôster retrato (capa 1280×1808). Leva para
 * a página de detalhe que lista os cursos da categoria.
 */
export function TrackCategoryCard({ category }: { category: TrackCategory }) {
  const Icon = ICONS[category.iconKey];
  const accent = ACCENTS[category.accent];
  const href = `/dashboard/trilhas/${trackCategorySlug(category)}`;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex aspect-[1280/1808] flex-col justify-end overflow-hidden rounded-medium border border-border-subtle bg-background-elevated",
        "shadow-elevation-sm transition-[box-shadow,transform,border-color] duration-200",
        "ring-1 ring-transparent",
        "hover:-translate-y-0.5 hover:border-border-default hover:shadow-elevation-md",
        accent.ring,
      )}
    >
      {/* Capa */}
      {category.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={category.coverImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          aria-hidden
          className={cn("absolute inset-0 bg-gradient-to-br", accent.coverGradient)}
        >
          <div className="absolute inset-0 bg-grid-pattern-subtle opacity-50" />
        </div>
      )}

      {/* Ícone */}
      <span
        aria-hidden
        className={cn(
          "absolute left-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-medium shadow-elevation-sm",
          "border border-white/60 backdrop-blur-sm",
          accent.iconBg,
          accent.iconText,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span
        aria-hidden
        className="absolute right-4 top-4 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100"
      >
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>

      {/* Conteúdo sobre o degradê */}
      <div className="relative z-10 flex flex-col gap-3 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-5 pb-5 pt-16">
        <div>
          <h3 className="text-[16px] font-semibold tracking-tight text-white">
            {category.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-white/75">
            {category.tagline}
          </p>
        </div>

        <div className="flex items-center gap-3 text-[12px] text-white/80">
          <Stat label="trilhas" value={category.trackCount} />
          <Divider />
          <Stat label="aulas" value={category.lessonCount} />
          <Divider />
          <Stat label="concluídas" value={category.completed} />
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
            <span className="font-medium uppercase tracking-[0.12em] text-white/70">
              Seu progresso
            </span>
            <span className="font-semibold tabular-nums text-white">
              {category.progressPct}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-brand-primary"
              style={{ width: `${category.progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-[14px] font-semibold tabular-nums text-white">
        {value}
      </span>
      <span className="text-white/65">{label}</span>
    </span>
  );
}

function Divider() {
  return <span aria-hidden className="h-3 w-px bg-white/25" />;
}
