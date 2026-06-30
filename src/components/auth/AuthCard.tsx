import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthCardProps = {
  children: ReactNode;
  className?: string;
};

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[440px] rounded-medium bg-background-elevated",
        "px-7 py-9 sm:px-9 sm:py-10",
        "shadow-elevation-lg shadow-inner-border",
        "animate-fade-in-up",
        className,
      )}
    >
      {children}
    </div>
  );
}
