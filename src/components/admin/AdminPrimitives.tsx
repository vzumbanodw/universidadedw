"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Breadcrumb + cabeçalho de página                                            */
/* -------------------------------------------------------------------------- */

type Crumb = { label: string; href?: string };

export function AdminPageHeader({
  breadcrumb,
  title,
  description,
  actions,
}: {
  breadcrumb?: Crumb[];
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex items-center gap-1.5 text-[12px] text-foreground-muted"
          >
            {breadcrumb.map((crumb, index) => {
              const last = index === breadcrumb.length - 1;
              return (
                <Fragment key={`${crumb.label}-${index}`}>
                  {crumb.href && !last ? (
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-foreground"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={last ? "text-foreground-subtitle" : undefined}>
                      {crumb.label}
                    </span>
                  )}
                  {!last ? (
                    <ChevronRight className="h-3 w-3" aria-hidden />
                  ) : null}
                </Fragment>
              );
            })}
          </nav>
        ) : null}
        <h1 className="text-[24px] font-semibold tracking-tight text-foreground-heading sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-[68ch] text-[14px] leading-relaxed text-foreground-subtitle">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2.5">{actions}</div> : null}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Métrica / Stat tile (mesmo visual das telas do aluno)                       */
/* -------------------------------------------------------------------------- */

export function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-regular border border-border-subtle bg-background-elevated px-4 py-3 shadow-elevation-sm">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-small bg-background-subtle text-foreground-subtitle"
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[20px] font-semibold leading-none tabular-nums text-foreground-heading">
          {value}
        </p>
        <p className="mt-1 truncate text-[12px] text-foreground-muted">{label}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Estado vazio                                                                */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-medium border border-dashed border-border-default bg-background-elevated px-6 py-14 text-center">
      <span
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-medium bg-background-subtle text-foreground-muted"
      >
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
          {title}
        </h3>
        <p className="mx-auto mt-1 max-w-[42ch] text-[13px] leading-relaxed text-foreground-muted">
          {description}
        </p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Cartão / painel padrão                                                      */
/* -------------------------------------------------------------------------- */

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-medium border border-border-subtle bg-background-elevated shadow-elevation-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
