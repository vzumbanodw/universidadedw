"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { AdminPageHeader, EmptyState, Panel } from "@/components/admin/AdminPrimitives";
import { Avatar } from "@/components/ui/Avatar";

type AuditEntry = {
  id: number;
  adminName: string;
  adminEmail?: string;
  action: string;
  createdAt: string;
};

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Histórico nominal de ações do backoffice (quem fez o quê, e quando). */
export default function HistoricoPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/audit")
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((data: { entries?: AuditEntry[] }) => {
        if (active) setEntries(data.entries ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Backoffice", href: "/admin" }, { label: "Histórico" }]}
        title="Histórico de ações"
        description="Registro nominal do que foi feito no backoffice: cadastros, edições, aprovações, recusas e exclusões — com responsável, ação e data."
      />

      {loading ? (
        <p className="py-10 text-center text-[13px] text-foreground-muted">Carregando…</p>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhuma ação registrada ainda"
          description="As ações dos administradores aparecem aqui a partir de agora — cadastros, aprovações, exclusões e edições."
        />
      ) : (
        <Panel className="divide-y divide-border-subtle overflow-hidden">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={entry.adminName} size="sm" />
                <div className="min-w-0">
                  <p className="text-[13.5px] text-foreground">
                    <strong className="font-semibold text-foreground-heading">
                      {entry.adminName}
                    </strong>{" "}
                    {entry.action}
                  </p>
                  {entry.adminEmail ? (
                    <p className="truncate text-[12px] text-foreground-muted">
                      {entry.adminEmail}
                    </p>
                  ) : null}
                </div>
              </div>
              <p className="shrink-0 text-[12.5px] tabular-nums text-foreground-muted">
                {formatDateTime(entry.createdAt)}
              </p>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}
