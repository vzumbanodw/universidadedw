"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import {
  AdminPageHeader,
  EmptyState,
  Panel,
  StatTile,
} from "@/components/admin/AdminPrimitives";
import { CertificateFormDialog } from "@/components/admin/CertificateFormDialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminStore } from "@/lib/admin/store";
import { formatDate, formatMinutes } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  CERTIFICATE_STATUS_LABEL,
  type IssuedCertificate,
  type IssuedCertificateStatus,
} from "@/types/admin";

const STATUS_VARIANT: Record<
  IssuedCertificateStatus,
  "success" | "orange" | "neutral"
> = {
  issued: "success",
  in_progress: "orange",
  available: "neutral",
};

export default function CertificadosPage() {
  const store = useAdminStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IssuedCertificate | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | IssuedCertificateStatus>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.certificates
      .filter((c) => (statusFilter === "all" ? true : c.status === statusFilter))
      .filter((c) =>
        q
          ? c.studentName.toLowerCase().includes(q) ||
            c.studentEmail.toLowerCase().includes(q) ||
            c.courseTitle.toLowerCase().includes(q)
          : true,
      );
  }, [store.certificates, query, statusFilter]);

  const issued = store.certificates.filter((c) => c.status === "issued").length;
  const inProgress = store.certificates.filter((c) => c.status === "in_progress").length;

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(cert: IssuedCertificate) {
    setEditing(cert);
    setDialogOpen(true);
  }

  function handleDelete(cert: IssuedCertificate) {
    if (window.confirm(`Excluir o certificado de "${cert.studentName}"?`)) {
      store.deleteCertificate(cert.id);
    }
  }

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Backoffice", href: "/admin" }, { label: "Certificados" }]}
        title="Certificados"
        description="Acompanhe os certificados emitidos e configure quais cursos os concedem."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/configuracoes">
              <Button variant="outline" leftIcon={<Settings className="h-4 w-4" />}>
                Configurar
              </Button>
            </Link>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>
              Registrar
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Award} label="Total" value={store.certificates.length} />
        <StatTile icon={CheckCircle2} label="Emitidos" value={issued} />
        <StatTile icon={Clock} label="Em andamento" value={inProgress} />
        <StatTile
          icon={Award}
          label="Cursos com certificado"
          value={store.courses.filter((c) => c.certificate).length}
        />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex h-10 flex-1 items-center rounded-regular border border-border-subtle bg-background-elevated transition-colors focus-within:border-foreground-subtitle">
          <Search aria-hidden className="ml-3 h-4 w-4 text-foreground-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por aluno ou curso..."
            aria-label="Buscar certificados"
            className="flex-1 bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-foreground-muted outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
            Todos
          </FilterPill>
          {(Object.keys(CERTIFICATE_STATUS_LABEL) as IssuedCertificateStatus[]).map((status) => (
            <FilterPill
              key={status}
              active={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            >
              {CERTIFICATE_STATUS_LABEL[status]}
            </FilterPill>
          ))}
        </div>
      </div>

      {store.certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Nenhum certificado ainda"
          description="Registre certificados manualmente ou configure cursos para emiti-los automaticamente."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>
              Registrar certificado
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum certificado encontrado"
          description="Ajuste a busca/filtros."
        />
      ) : (
        <Panel className="divide-y divide-border-subtle overflow-hidden">
          {filtered.map((cert) => (
            <div key={cert.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-regular bg-brand-primary/10 text-brand-primary"
              >
                <Award className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-[14px] font-semibold text-foreground-heading">
                    {cert.studentName}
                  </h3>
                  <Badge variant={STATUS_VARIANT[cert.status]} size="sm" dot>
                    {CERTIFICATE_STATUS_LABEL[cert.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[12px] text-foreground-muted">
                  <span className="truncate">{cert.courseTitle}</span>
                  <span>{formatMinutes(cert.workloadMinutes)}</span>
                  {cert.credentialId ? <span>{cert.credentialId}</span> : null}
                  {cert.issuedAt ? <span>{formatDate(cert.issuedAt)}</span> : null}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <IconButton label="Editar certificado" onClick={() => openEdit(cert)}>
                  <Pencil className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label="Excluir certificado"
                  variant="danger"
                  onClick={() => handleDelete(cert)}
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          ))}
        </Panel>
      )}

      <CertificateFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        certificate={editing}
      />
    </div>
  );
}

function FilterPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 shrink-0 items-center rounded-regular px-3.5 text-[13px] font-medium transition-colors",
        active
          ? "border border-foreground-heading bg-foreground-heading text-background-elevated"
          : "border border-border-subtle bg-background-elevated text-foreground-subtitle hover:border-border-default hover:bg-background-subtle hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function IconButton({
  children,
  label,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-regular border border-border-subtle bg-background-elevated transition-colors",
        variant === "danger"
          ? "text-foreground-muted hover:border-border-error hover:bg-background-error hover:text-foreground-error"
          : "text-foreground-muted hover:border-border-default hover:bg-background-subtle hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
