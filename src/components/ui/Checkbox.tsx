"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ id, label, className, ...rest }, ref) {
    const inputId = id ?? rest.name;

    return (
      <label
        htmlFor={inputId}
        className={cn(
          "group inline-flex items-center gap-2 cursor-pointer select-none text-sm text-foreground-subtitle",
          className,
        )}
      >
        <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            className="peer h-4 w-4 cursor-pointer appearance-none rounded-[4px] border border-border-default bg-background-elevated transition-colors duration-150 checked:border-brand-secondary checked:bg-brand-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
            {...rest}
          />
          <Check
            aria-hidden
            className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
            strokeWidth={3}
          />
        </span>
        <span>{label}</span>
      </label>
    );
  },
);
