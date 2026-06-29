"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectOption = { value: string; label: string };

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, hint, error, options, placeholder, className, required, ...rest },
  ref,
) {
  const selectId = id ?? rest.name;
  const invalid = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-foreground-subtitle"
        >
          {label}
          {required ? <span className="ml-0.5 text-foreground-error">*</span> : null}
        </label>
      ) : null}

      <div
        className={cn(
          "group relative flex h-12 items-center rounded-regular bg-background-elevated",
          "border transition-[border-color,box-shadow] duration-200",
          invalid
            ? "border-border-error shadow-[0_0_0_3px_rgba(248,71,58,0.10)]"
            : "border-border-default hover:border-neutral-400 focus-within:border-brand-primary focus-within:shadow-focus-ring",
        )}
      >
        <select
          ref={ref}
          id={selectId}
          aria-invalid={invalid || undefined}
          aria-required={required || undefined}
          className={cn(
            "peer h-full flex-1 appearance-none bg-transparent px-3.5 pr-10 text-[15px] text-foreground outline-none",
            "disabled:cursor-not-allowed disabled:text-foreground-disabled",
          )}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3.5 h-4 w-4 text-foreground-muted"
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
});
