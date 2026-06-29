"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium rounded-regular " +
  "transition-[background-color,box-shadow,transform,opacity] duration-200 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:cursor-not-allowed disabled:opacity-60 select-none active:translate-y-px";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-button-primary text-white hover:bg-brand-dark focus-visible:ring-brand-primary shadow-elevation-sm hover:shadow-elevation-md",
  secondary:
    "bg-button-secondary text-white hover:bg-brand-secondary focus-visible:ring-brand-primary shadow-elevation-sm",
  outline:
    "bg-transparent text-foreground-brand border border-border-default hover:bg-background-subtle focus-visible:ring-brand-primary",
  ghost:
    "bg-transparent text-foreground-brand hover:bg-background-subtle focus-visible:ring-brand-primary",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner size="sm" />
          <span>Entrando…</span>
        </>
      ) : (
        <>
          {leftIcon ? <span aria-hidden>{leftIcon}</span> : null}
          {children}
          {rightIcon ? <span aria-hidden>{rightIcon}</span> : null}
        </>
      )}
    </button>
  );
});
