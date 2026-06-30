"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { id, label, hint, error, className, required, rows = 4, ...rest },
    ref,
  ) {
    const textareaId = id ?? rest.name;
    const invalid = Boolean(error);

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label ? (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-foreground-subtitle"
          >
            {label}
            {required ? <span className="ml-0.5 text-foreground-error">*</span> : null}
          </label>
        ) : null}

        <div
          className={cn(
            "rounded-regular bg-background-elevated",
            "border transition-[border-color,box-shadow] duration-200",
            invalid
              ? "border-border-error shadow-[0_0_0_3px_rgba(248,71,58,0.10)]"
              : "border-border-default hover:border-neutral-400 focus-within:border-brand-primary focus-within:shadow-focus-ring",
          )}
        >
          <textarea
            ref={ref}
            id={textareaId}
            rows={rows}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            className={cn(
              "w-full resize-y bg-transparent px-3.5 py-3 text-[15px] leading-relaxed text-foreground outline-none",
              "placeholder:text-foreground-placeholder disabled:cursor-not-allowed disabled:text-foreground-disabled",
            )}
            {...rest}
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-foreground-error animate-fade-in">
            {error}
          </p>
        ) : hint ? (
          <p className="text-sm text-foreground-disabled">{hint}</p>
        ) : null}
      </div>
    );
  },
);
