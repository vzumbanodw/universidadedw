"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  startIcon?: ReactNode;
  endSlot?: ReactNode;
  inputClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    hint,
    error,
    startIcon,
    endSlot,
    className,
    inputClassName,
    required,
    ...rest
  },
  ref,
) {
  const inputId = id ?? rest.name;
  const describedBy = error
    ? `${inputId}-error`
    : hint
    ? `${inputId}-hint`
    : undefined;
  const invalid = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground-subtitle"
        >
          {label}
          {required ? <span className="text-foreground-error ml-0.5">*</span> : null}
        </label>
      ) : null}

      <div
        className={cn(
          "group relative flex items-center h-12 rounded-regular bg-background-elevated",
          "border transition-[border-color,box-shadow] duration-200",
          invalid
            ? "border-border-error shadow-[0_0_0_3px_rgba(248,71,58,0.10)]"
            : "border-border-default hover:border-neutral-400 focus-within:border-brand-primary focus-within:shadow-focus-ring",
        )}
      >
        {startIcon ? (
          <span
            aria-hidden
            className={cn(
              "pl-3.5 pr-1 flex items-center",
              invalid ? "text-foreground-error" : "text-icon-disabled",
            )}
          >
            {startIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={cn(
            "peer flex-1 h-full bg-transparent outline-none",
            "px-3.5 text-[15px] text-foreground placeholder:text-foreground-placeholder",
            "disabled:cursor-not-allowed disabled:text-foreground-disabled",
            startIcon && "pl-1",
            endSlot && "pr-1",
            inputClassName,
          )}
          {...rest}
        />
        {endSlot ? <div className="pr-1.5 flex items-center">{endSlot}</div> : null}
      </div>

      {error ? (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-sm text-foreground-error animate-fade-in"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-sm text-foreground-disabled">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
