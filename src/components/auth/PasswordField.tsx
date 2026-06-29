"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/Input";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  error?: string;
  showStartIcon?: boolean;
};

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(
    { label = "Senha", error, showStartIcon = true, ...rest },
    ref,
  ) {
    const [visible, setVisible] = useState(false);

    return (
      <Input
        ref={ref}
        label={label}
        type={visible ? "text" : "password"}
        autoComplete="current-password"
        error={error}
        startIcon={showStartIcon ? <Lock className="h-4 w-4" /> : undefined}
        endSlot={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={visible}
            className="inline-flex h-9 w-9 items-center justify-center rounded-small text-icon-disabled transition-colors hover:bg-background-subtle hover:text-icon-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            {visible ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        }
        {...rest}
      />
    );
  },
);
