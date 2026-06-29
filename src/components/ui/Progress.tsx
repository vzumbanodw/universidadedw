import { cn } from "@/lib/utils";

type ProgressTone = "primary" | "orange" | "green" | "violet" | "info" | "gradient";
type ProgressSize = "xs" | "sm" | "md";

type ProgressProps = {
  value: number;
  max?: number;
  tone?: ProgressTone;
  size?: ProgressSize;
  className?: string;
  showValue?: boolean;
  label?: string;
  ariaLabel?: string;
};

const TONES: Record<ProgressTone, string> = {
  primary: "bg-brand-secondary",
  orange: "bg-brand-orange",
  green: "bg-brand-green",
  violet: "bg-[#9BB5FF]",
  info: "bg-foreground-information",
  // kept for API compatibility — now solid Dataweb dark blue (no gradient)
  gradient: "bg-brand-secondary",
};

const SIZES: Record<ProgressSize, string> = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
};

export function Progress({
  value,
  max = 100,
  tone = "primary",
  size = "sm",
  className,
  showValue = false,
  label,
  ariaLabel,
}: ProgressProps) {
  const safe = Math.max(0, Math.min(max, value));
  const pct = (safe / max) * 100;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || showValue) && (
        <div className="flex items-baseline justify-between text-[12px]">
          {label ? <span className="text-foreground-muted">{label}</span> : <span />}
          {showValue ? (
            <span className="font-medium tabular-nums text-foreground-subtitle">
              {Math.round(pct)}%
            </span>
          ) : null}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={ariaLabel ?? label ?? "Progresso"}
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-surface-muted",
          SIZES[size],
        )}
      >
        <div
          className={cn(
            "h-full origin-left rounded-full transition-transform duration-700 ease-out",
            "animate-progress-grow",
            TONES[tone],
          )}
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>
    </div>
  );
}
