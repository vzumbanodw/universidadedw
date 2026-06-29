import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";
import { formatDate, formatMinutes } from "@/lib/formatters";
import type {
  Certificate,
  CertificateStatus,
} from "@/types/certificates";

const STATUS: Record<
  CertificateStatus,
  {
    label: string;
    action: string;
    icon: LucideIcon;
    actionIcon: LucideIcon;
    badge: "success" | "primary" | "warning";
    iconClass: string;
  }
> = {
  issued: {
    label: "Emitido",
    action: "Baixar",
    icon: CheckCircle2,
    actionIcon: Download,
    badge: "success",
    iconClass: "bg-background-success text-foreground-success",
  },
  in_progress: {
    label: "Em progresso",
    action: "Continuar",
    icon: Award,
    actionIcon: ArrowRight,
    badge: "primary",
    iconClass: "bg-brand-primary/12 text-brand-primary",
  },
  available: {
    label: "Disponível",
    action: "Iniciar",
    icon: Lock,
    actionIcon: ArrowRight,
    badge: "warning",
    iconClass: "bg-background-warning text-foreground-warning",
  },
};

export function CertificateCard({
  certificate,
}: {
  certificate: Certificate;
}) {
  const meta = STATUS[certificate.status];
  const Icon = meta.icon;
  const ActionIcon = meta.actionIcon;
  const progress = certificate.status === "issued" ? 100 : certificate.progress ?? 0;

  return (
    <article className="flex min-h-[292px] flex-col rounded-medium border border-border-subtle bg-background-elevated p-5 shadow-elevation-sm transition-[border-color,box-shadow] hover:border-border-default hover:shadow-elevation-md">
      <div className="flex items-start justify-between gap-4">
        <span
          aria-hidden
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-regular",
            meta.iconClass,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <Badge variant={meta.badge} size="sm" dot>
          {meta.label}
        </Badge>
      </div>

      <div className="mt-5 min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-foreground-muted">
          {certificate.courseTitle}
        </p>
        <h2 className="mt-1 text-[18px] font-semibold leading-snug tracking-tight text-foreground-heading">
          {certificate.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-foreground-muted">
          {certificate.description}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-foreground-muted">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {formatMinutes(certificate.estimatedMinutes)}
        </span>
        {certificate.issuedAt ? (
          <span>Emitido em {formatDate(certificate.issuedAt)}</span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {certificate.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-border-subtle bg-background-subtle px-2 py-1 text-[11.5px] text-foreground-subtitle"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <Progress
          value={progress}
          tone="primary"
          size="xs"
          label={certificate.status === "issued" ? "Certificação concluída" : "Progresso"}
          showValue
        />
        <button
          type="button"
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-regular border border-border-subtle bg-background-subtle px-3 text-[13px] font-medium text-foreground-subtitle transition-colors hover:border-border-default hover:bg-surface-elevated hover:text-foreground"
        >
          {meta.action}
          <ActionIcon className="h-4 w-4" aria-hidden />
        </button>
        {certificate.credentialId ? (
          <p className="mt-2 text-center text-[11px] text-foreground-disabled">
            Credencial {certificate.credentialId}
          </p>
        ) : null}
      </div>
    </article>
  );
}
