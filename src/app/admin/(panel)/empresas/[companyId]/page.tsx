"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  Building2,
  KeyRound,
  Mail,
  Pencil,
  Plus,
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
import { RoleFormDialog } from "@/components/admin/RoleFormDialog";
import { MemberBulkDialog } from "@/components/admin/MemberBulkDialog";
import { MemberAccessDialog } from "@/components/admin/MemberAccessDialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Select } from "@/components/ui/Select";
import { useAdminStore } from "@/lib/admin/store";
import { cn } from "@/lib/utils";
import {
  ACCESS_LEVEL_LABEL,
  MEMBER_STATUS_LABEL,
  type AccessRole,
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

  const [companyDialog, setCompanyDialog] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<AccessRole | null>(null);
  const [bulkDialog, setBulkDialog] = useState(false);
  const [accessDialog, setAccessDialog] = useState(false);
  const [accessMember, setAccessMember] = useState<CompanyMember | null>(null);

  const company = store.companies.find((c) => c.id === companyId);
  const roles = store.rolesForCompany(companyId);
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

  function roleName(roleId: string): AccessRole | undefined {
    return roles.find((r) => r.id === roleId);
  }

  function openNewRole() {
    setEditingRole(null);
    setRoleDialog(true);
  }

  function openEditRole(role: AccessRole) {
    setEditingRole(role);
    setRoleDialog(true);
  }

  function handleDeleteRole(role: AccessRole) {
    const used = members.filter((m) => m.roleId === role.id).length;
    if (used > 0) {
      window.alert(
        `O perfil "${role.name}" está em uso por ${used} usuário(s). Reatribua-os antes de excluir.`,
      );
      return;
    }
    if (window.confirm(`Excluir o perfil "${role.name}"?`)) {
      store.deleteRole(role.id);
    }
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

  function openAccess(member: CompanyMember) {
    setAccessMember(member);
    setAccessDialog(true);
  }

  function changeMemberRole(member: CompanyMember, roleId: string) {
    store.upsertMember({ ...member, roleId });
  }

  function changeMemberStatus(member: CompanyMember, status: MemberStatus) {
    store.upsertMember({ ...member, status });
  }

  const activeCount = members.filter((m) => m.status === "active").length;

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
        <StatTile icon={Users} label="Usuários" value={members.length} />
        <StatTile icon={ShieldCheck} label="Ativos" value={activeCount} />
        <StatTile icon={Building2} label="Assentos" value={company.seats} />
        <StatTile icon={UserPlus} label="Perfis" value={roles.length} />
      </section>

      {/* Perfis de acesso */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-foreground-heading">
              Perfis de acesso
            </h2>
            <p className="mt-0.5 text-[13px] text-foreground-muted">
              Cada perfil define o que um tipo de funcionário enxerga na Universidade.
            </p>
          </div>
          <Button
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openNewRole}
          >
            Novo perfil
          </Button>
        </div>

        {roles.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Nenhum perfil de acesso"
            description="Crie perfis como 'Gestão', 'Atendimento' ou 'Laboratório' para liberar conteúdos por função."
            action={
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNewRole}>
                Novo perfil
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => {
              const categories = store.categories.filter((c) =>
                role.categoryIds.includes(c.id),
              );
              const extraCourses = store.courses.filter((c) =>
                role.courseIds.includes(c.id),
              );
              const memberCount = members.filter((m) => m.roleId === role.id).length;
              return (
                <Panel key={role.id} className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[14.5px] font-semibold text-foreground-heading">
                        {role.name}
                      </h3>
                      <p className="mt-0.5 text-[12px] text-foreground-muted">
                        {ACCESS_LEVEL_LABEL[role.level]} · {memberCount} usuário
                        {memberCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <IconButton label="Editar perfil" onClick={() => openEditRole(role)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </IconButton>
                      <IconButton
                        label="Excluir perfil"
                        variant="danger"
                        onClick={() => handleDeleteRole(role)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconButton>
                    </div>
                  </div>
                  {role.description ? (
                    <p className="text-[12.5px] leading-relaxed text-foreground-muted">
                      {role.description}
                    </p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    {categories.map((c) => (
                      <Badge key={c.id} variant="primary" size="sm">
                        {c.name}
                      </Badge>
                    ))}
                    {extraCourses.map((c) => (
                      <Badge key={c.id} variant="neutral" size="sm">
                        {c.title}
                      </Badge>
                    ))}
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </section>

      {/* Usuários */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-foreground-heading">
              Usuários da empresa
            </h2>
            <p className="mt-0.5 text-[13px] text-foreground-muted">
              Acessos individuais criados para os funcionários desta empresa.
            </p>
          </div>
          <Button
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => setBulkDialog(true)}
            disabled={roles.length === 0}
          >
            Adicionar usuários
          </Button>
        </div>

        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum usuário ainda"
            description={
              roles.length === 0
                ? "Crie um perfil de acesso e depois adicione os funcionários em lote."
                : "Adicione os funcionários em lote, colando a lista da equipe."
            }
            action={
              roles.length > 0 ? (
                <Button
                  leftIcon={<UserPlus className="h-4 w-4" />}
                  onClick={() => setBulkDialog(true)}
                >
                  Adicionar usuários
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Panel className="divide-y divide-border-subtle overflow-hidden">
            {members.map((member) => {
              const role = roleName(member.roleId);
              return (
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
                    <Select
                      aria-label={`Perfil de ${member.name}`}
                      value={member.roleId}
                      onChange={(e) => changeMemberRole(member, e.target.value)}
                      options={roles.map((r) => ({ value: r.id, label: r.name }))}
                      className="w-[170px] [&>div]:h-9 [&_select]:h-9 [&_select]:text-[13px]"
                    />
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
                    {role ? (
                      <Badge variant="neutral" size="sm">
                        {ACCESS_LEVEL_LABEL[role.level]}
                      </Badge>
                    ) : null}
                    <IconButton
                      label={member.authUserId ? "Gerenciar acesso" : "Criar acesso"}
                      variant={member.authUserId ? "active" : "default"}
                      onClick={() => openAccess(member)}
                    >
                      <KeyRound className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label="Remover usuário"
                      variant="danger"
                      onClick={() => handleDeleteMember(member)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </Panel>
        )}
      </section>

      <CompanyFormDialog
        open={companyDialog}
        onClose={() => setCompanyDialog(false)}
        company={company}
      />
      <RoleFormDialog
        open={roleDialog}
        onClose={() => setRoleDialog(false)}
        companyId={company.id}
        role={editingRole}
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
