"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileSpreadsheet,
  KeyRound,
  Mail,
  Pencil,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  AdminPageHeader,
  EmptyState,
  Panel,
  StatTile,
} from "@/components/admin/AdminPrimitives";
import { CompanyFormDialog } from "@/components/admin/CompanyFormDialog";
import { MemberFormDialog } from "@/components/admin/MemberFormDialog";
import { MemberBulkDialog } from "@/components/admin/MemberBulkDialog";
import { MemberAccessDialog } from "@/components/admin/MemberAccessDialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useAdminStore } from "@/lib/admin/store";
import { cn } from "@/lib/utils";
import {
  MEMBER_STATUS_LABEL,
  type CompanyMember,
  type MemberStatus,
} from "@/types/admin";

const STATUS_VARIANT: Record<MemberStatus, "success" | "orange" | "neutral"> = {
  active: "success",
  invited: "orange",
  suspended: "neutral",
};

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = use(params);
  const store = useAdminStore();
  const router = useRouter();

  const [companyDialog, setCompanyDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [memberDialog, setMemberDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<CompanyMember | null>(null);
  const [bulkDialog, setBulkDialog] = useState(false);
  const [accessDialog, setAccessDialog] = useState(false);
  const [accessMember, setAccessMember] = useState<CompanyMember | null>(null);

  const company = store.companies.find((c) => c.id === companyId);
  const members = store.membersForCompany(companyId);

  if (store.ready && !company) {
    return (
      <div className="mx-auto max-w-[900px]">
        <EmptyState
          icon={Building2}
          title="Empresa não encontrada"
          description="Ela pode ter sido removida. Volte para a lista de empresas."
          action={
            <Link href="/admin/empresas">
              <Button variant="outline">Voltar para empresas</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (!company) {
    return <div className="mx-auto max-w-[900px] py-10 text-foreground-muted">Carregando…</div>;
  }

  async function handleDeleteMember(member: CompanyMember) {
    if (!window.confirm(`Remover o acesso de "${member.name}"?`)) return;
    // Remove também a conta no Supabase Auth, se existir.
    if (member.authUserId) {
      try {
        await fetch(`/api/admin/students?userId=${member.authUserId}`, {
          method: "DELETE",
        });
      } catch {
        /* segue removendo o registro local mesmo se a chamada falhar */
      }
    }
    store.deleteMember(member.id);
  }

  async function handleDeleteCompany() {
    if (!company) return;
    const count = members.length;
    const ok = window.confirm(
      count > 0
        ? `Excluir "${company.name}" e seus ${count} funcionário(s)? Os acessos serão removidos e esta ação não pode ser desfeita.`
        : `Excluir "${company.name}"? Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;
    setDeleting(true);
    // Remove também as contas no Supabase Auth dos funcionários com acesso criado.
    await Promise.all(
      members
        .filter((m) => m.authUserId)
        .map((m) =>
          fetch(`/api/admin/students?userId=${m.authUserId}`, {
            method: "DELETE",
          }).catch(() => {}),
        ),
    );
    store.deleteCompany(company.id);
    router.replace("/admin/empresas");
  }

  function openNewMember() {
    setEditingMember(null);
    setMemberDialog(true);
  }

  function openEditMember(member: CompanyMember) {
    setEditingMember(member);
    setMemberDialog(true);
  }

  function openAccess(member: CompanyMember) {
    setAccessMember(member);
    setAccessDialog(true);
  }

  function changeMemberStatus(member: CompanyMember, status: MemberStatus) {
    store.upsertMember({ ...member, status });
  }

  const activeCount = members.filter((m) => m.status === "active").length;
  const invitedCount = members.filter((m) => m.status === "invited").length;

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[
          { label: "Backoffice", href: "/admin" },
          { label: "Empresas", href: "/admin/empresas" },
          { label: company.name },
        ]}
        title={company.name}
        description={`${company.segment || "Empresa cliente"} · ${company.contactEmail || "sem contato"}`}
        actions={
          <Button
            variant="outline"
            leftIcon={<Pencil className="h-4 w-4" />}
            onClick={() => setCompanyDialog(true)}
          >
            Editar empresa
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Users} label="Funcionários" value={members.length} />
        <StatTile icon={ShieldCheck} label="Ativos" value={activeCount} />
        <StatTile icon={UserPlus} label="Convidados" value={invitedCount} />
        <StatTile icon={Building2} label="Assentos" value={company.seats} />
      </section>

      {/* Funcionários */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-foreground-heading">
              Funcionários da empresa
            </h2>
            <p className="mt-0.5 text-[13px] text-foreground-muted">
              Todos os funcionários têm acesso a todo o conteúdo da Universidade.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={() => setBulkDialog(true)}
            >
              Importar Excel
            </Button>
            <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={openNewMember}>
              Adicionar funcionário
            </Button>
          </div>
        </div>

        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum funcionário ainda"
            description="Adicione um a um (nome e email) ou importe uma planilha Excel com a equipe."
            action={
              <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={openNewMember}>
                Adicionar funcionário
              </Button>
            }
          />
        ) : (
          <Panel className="divide-y divide-border-subtle overflow-hidden">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={member.name} size="sm" />
                  <div className="min-w-0">
                    <h3 className="truncate text-[14px] font-semibold text-foreground-heading">
                      {member.name}
                    </h3>
                    <p className="flex items-center gap-1.5 truncate text-[12.5px] text-foreground-muted">
                      <Mail className="h-3 w-3 shrink-0" aria-hidden />
                      {member.email}
                      {member.jobTitle ? (
                        <span className="text-foreground-muted">· {member.jobTitle}</span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      changeMemberStatus(
                        member,
                        member.status === "active" ? "suspended" : "active",
                      )
                    }
                    title="Alternar status"
                  >
                    <Badge variant={STATUS_VARIANT[member.status]} size="sm" dot>
                      {MEMBER_STATUS_LABEL[member.status]}
                    </Badge>
                  </button>
                  <IconButton label="Editar funcionário" onClick={() => openEditMember(member)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label={member.authUserId ? "Gerenciar acesso" : "Criar acesso"}
                    variant={member.authUserId ? "active" : "default"}
                    onClick={() => openAccess(member)}
                  >
                    <KeyRound className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Remover funcionário"
                    variant="danger"
                    onClick={() => handleDeleteMember(member)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            ))}
          </Panel>
        )}
      </section>

      {/* Zona de perigo */}
      <section className="rounded-medium border border-border-subtle bg-background-elevated p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
              Excluir empresa
            </h2>
            <p className="mt-0.5 text-[13px] text-foreground-muted">
              Remove a empresa
              {members.length > 0
                ? ` e seus ${members.length} funcionário(s) e acessos`
                : ""}
              . Esta ação não pode ser desfeita.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDeleteCompany}
            disabled={deleting}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-regular border border-border-error bg-background-elevated px-4 text-sm font-medium text-foreground-error transition-colors hover:bg-background-error disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {deleting ? "Excluindo…" : "Excluir empresa"}
          </button>
        </div>
      </section>

      <CompanyFormDialog
        open={companyDialog}
        onClose={() => setCompanyDialog(false)}
        company={company}
      />
      <MemberFormDialog
        open={memberDialog}
        onClose={() => setMemberDialog(false)}
        companyId={company.id}
        member={editingMember}
      />
      <MemberBulkDialog
        open={bulkDialog}
        onClose={() => setBulkDialog(false)}
        companyId={company.id}
      />
      <MemberAccessDialog
        open={accessDialog}
        onClose={() => setAccessDialog(false)}
        member={accessMember}
      />
    </div>
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
  variant?: "default" | "danger" | "active";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-regular border transition-colors",
        variant === "danger"
          ? "border-border-subtle bg-background-elevated text-foreground-muted hover:border-border-error hover:bg-background-error hover:text-foreground-error"
          : variant === "active"
            ? "border-brand-primary/30 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/15"
            : "border-border-subtle bg-background-elevated text-foreground-muted hover:border-border-default hover:bg-background-subtle hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
