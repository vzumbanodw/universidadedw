import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type FormErrorProps = {
  message?: string | null;
  className?: string;
};

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-regular border border-border-error bg-background-error px-3.5 py-3 text-sm text-foreground-error",
        "animate-fade-in",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span className="leading-snug">{message}</span>
    </div>
  );
}
