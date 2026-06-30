import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "orange"
  | "violet";

type BadgeSize = "sm" | "md";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  dot?: boolean;
};

const VARIANTS: Record<BadgeVariant, string> = {
  neutral:
    "bg-surface-muted text-foreground-subtitle border border-border-subtle",
  primary: "bg-brand-primary/10 text-brand-primary border border-brand-primary/20",
  success: "bg-background-success text-foreground-success border border-border-success/30",
  warning: "bg-background-warning text-foreground-warning border border-border-warning/30",
  error: "bg-background-error text-foreground-error border border-border-error/30",
  info: "bg-background-information text-foreground-information border border-border-information/30",
  orange: "bg-brand-orange/12 text-brand-orange border border-brand-orange/25",
  violet: "bg-[#6C90FF]/12 text-[#9BB5FF] border border-[#6C90FF]/25",
};

const SIZES: Record<BadgeSize, string> = {
  sm: "h-5 px-2 text-[11px]",
  md: "h-6 px-2.5 text-[12px]",
};

const DOTS: Record<BadgeVariant, string> = {
  neutral: "bg-foreground-muted",
  primary: "bg-brand-primary",
  success: "bg-foreground-success",
  warning: "bg-foreground-warning",
  error: "bg-foreground-error",
  info: "bg-foreground-information",
  orange: "bg-brand-orange",
  violet: "bg-[#9BB5FF]",
};

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  icon,
  dot,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {dot ? (
        <span className={cn("h-1.5 w-1.5 rounded-full", DOTS[variant])} aria-hidden />
      ) : null}
      {icon ? <span aria-hidden className="-ml-0.5">{icon}</span> : null}
      {children}
    </span>
  );
}
