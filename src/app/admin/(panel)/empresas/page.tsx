"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Plus,
  Users,
} from "lucide-react";
import { AdminPageHeader, EmptyState, Panel } from "@/components/admin/AdminPrimitives";
import { CompanyFormDialog } from "@/components/admin/CompanyFormDialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { useAdminStore } from "@/lib/admin/store";

export default function EmpresasPage() {
  const store = useAdminStore();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Backoffice", href: "/admin" }, { label: "Empresas & Acessos" }]}
        title="Empresas & Acessos"
        description="Cada empresa cliente tem seus próprios perfis de acesso e usuários. Abra uma empresa para gerenciar a equipe."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
            Nova empresa
          </Button>
        }
      />

      {store.companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhuma empresa cadastrada"
          description="Cadastre a primeira empresa para começar a liberar acessos para a equipe dela."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
              Nova empresa
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {store.companies.map((company) => {
            const members = store.membersForCompany(company.id);
            const roles = store.rolesForCompany(company.id);
            const occupancy = company.seats
              ? Math.round((members.length / company.seats) * 100)
              : 0;
            return (
              <Link
                key={company.id}
                href={`/admin/empresas/${company.id}`}
                className="group flex flex-col gap-4 rounded-medium border border-border-subtle bg-background-elevated p-5 shadow-elevation-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-border-default hover:shadow-elevation-md"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-regular bg-background-subtle text-foreground-subtitle"
                  >
                    {company.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={company.logoUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-semibold tracking-tight text-foreground-heading">
                      {company.name}
                    </h3>
                    <p className="truncate text-[12.5px] text-foreground-muted">
                      {company.segment || "Sem segmento"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="neutral" size="sm" icon={<Users className="h-3 w-3" />}>
                    {members.length} usuário{members.length === 1 ? "" : "s"}
                  </Badge>
                  <Badge variant="primary" size="sm">
                    {roles.length} perfil{roles.length === 1 ? "" : "s"}
                  </Badge>
                </div>

                <div>
                  <div className="mb-1.5 flex items-baseline justify-between text-[11.5px]">
                    <span className="font-medium uppercase tracking-[0.12em] text-foreground-muted">
                      Ocupação de assentos
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {members.length}/{company.seats}
                    </span>
                  </div>
                  <Progress value={occupancy} tone="primary" size="xs" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <CompanyFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
