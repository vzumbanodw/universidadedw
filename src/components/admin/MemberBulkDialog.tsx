"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminStore } from "@/lib/admin/store";
import { createId } from "@/lib/admin/options";
import { ACCESS_LEVEL_LABEL } from "@/types/admin";
import { cn } from "@/lib/utils";
import type { AccessRole, CompanyMember } from "@/types/admin";

type MemberBulkDialogProps = {
  open: boolean;
  onClose: () => void;
  companyId: string;
};

type ParsedRow = {
  name: string;
  email: string;
  jobTitle: string;
  valid: boolean;
  duplicate: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Faz o parse de uma planilha colada. Aceita separadores vírgula, ponto-e-vírgula
 * ou tabulação. Ordem por linha: Nome, E-mail, Cargo (cargo opcional).
 */
function parseBulk(
  raw: string,
  existingEmails: Set<string>,
): ParsedRow[] {
  const seen = new Set<string>();
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      const name = parts[0] ?? "";
      const email = (parts[1] ?? "").toLowerCase();
      const jobTitle = parts[2] ?? "";
      const validEmail = EMAIL_RE.test(email);
      const duplicate =
        existingEmails.has(email) || (validEmail && seen.has(email));
      if (validEmail) seen.add(email);
      return {
        name,
        email,
        jobTitle,
        valid: Boolean(name) && validEmail,
        duplicate,
      };
    });
}

export function MemberBulkDialog({ open, onClose, companyId }: MemberBulkDialogProps) {
  const store = useAdminStore();
  const roles = store.rolesForCompany(companyId);
  const company = store.companies.find((c) => c.id === companyId);
  const currentMembers = store.membersForCompany(companyId);

  const [roleId, setRoleId] = useState<string>("");
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setRaw("");
    setRoleId(roles[0]?.id ?? "");
  }, [open, roles]);

  const existingEmails = useMemo(
    () => new Set(currentMembers.map((m) => m.email.toLowerCase())),
    [currentMembers],
  );

  const rows = useMemo(() => parseBulk(raw, existingEmails), [raw, existingEmails]);
  const validRows = rows.filter((r) => r.valid && !r.duplicate);

  const selectedRole = roles.find((r) => r.id === roleId);
  const seatsLeft = company ? company.seats - currentMembers.length : 0;
  const exceedsSeats = validRows.length > seatsLeft;

  function handleCreate() {
    if (!roleId) {
      setError("Selecione um perfil de acesso para os usuários.");
      return;
    }
    if (validRows.length === 0) {
      setError("Cole ao menos uma linha válida (Nome e e-mail).");
      return;
    }

    const now = new Date().toISOString();
    const members: CompanyMember[] = validRows.map((row) => ({
      id: createId("mb"),
      companyId,
      name: row.name,
      email: row.email,
      jobTitle: row.jobTitle || ACCESS_LEVEL_LABEL[selectedRole?.level ?? "student"],
      roleId,
      status: "invited",
      createdAt: now,
    }));

    store.addMembers(members);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Adicionar usuários em lote"
      description="Cole a lista de funcionários e escolha o perfil de acesso. Cada um recebe um acesso individual à Universidade."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            leftIcon={<UserPlus className="h-4 w-4" />}
            disabled={validRows.length === 0}
          >
            Criar {validRows.length > 0 ? `${validRows.length} ` : ""}acesso
            {validRows.length === 1 ? "" : "s"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p role="alert" className="rounded-regular border border-border-error bg-background-error px-3.5 py-2.5 text-sm text-foreground-error">
            {error}
          </p>
        ) : null}

        {roles.length === 0 ? (
          <p className="rounded-regular border border-border-warning bg-background-warning px-3.5 py-3 text-sm text-foreground-warning">
            Crie um perfil de acesso antes de adicionar usuários.
          </p>
        ) : (
          <>
            <Select
              label="Perfil de acesso (aplicado a todos)"
              required
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              options={roles.map((r) => ({
                value: r.id,
                label: `${r.name} · ${ACCESS_LEVEL_LABEL[r.level]}`,
              }))}
            />

            {selectedRole ? <RoleSummary role={selectedRole} store={store} /> : null}

            <Textarea
              label="Funcionários"
              rows={6}
              hint="Uma pessoa por linha, no formato Nome, e-mail, cargo (o cargo é opcional). Separe por vírgula ou ponto-e-vírgula."
              placeholder={
                "Maria Silva, maria.silva@empresa.com.br, Vendedora\nJoão Souza; joao.souza@empresa.com.br; Caixa"
              }
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
            />

            {/* Resumo de assentos */}
            <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-foreground-muted">
              <Badge variant="neutral" size="sm">
                {validRows.length} válido{validRows.length === 1 ? "" : "s"}
              </Badge>
              {rows.length - validRows.length > 0 ? (
                <Badge variant="warning" size="sm">
                  {rows.length - validRows.length} ignorado(s)
                </Badge>
              ) : null}
              {company ? (
                <span>
                  {seatsLeft} de {company.seats} assento(s) disponível(is)
                </span>
              ) : null}
            </div>

            {exceedsSeats ? (
              <p className="flex items-start gap-2 rounded-regular border border-border-warning bg-background-warning px-3.5 py-2.5 text-[13px] text-foreground-warning">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                A lista ultrapassa as licenças contratadas. Você ainda pode criar,
                mas revise o número de assentos da empresa.
              </p>
            ) : null}

            {/* Pré-visualização */}
            {rows.length > 0 ? (
              <div className="overflow-hidden rounded-regular border border-border-subtle">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-background-subtle text-[11px] uppercase tracking-[0.08em] text-foreground-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">Nome</th>
                      <th className="px-3 py-2 font-medium">E-mail</th>
                      <th className="px-3 py-2 font-medium">Cargo</th>
                      <th className="px-3 py-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {rows.map((row, index) => (
                      <tr
                        key={index}
                        className={cn(
                          !row.valid || row.duplicate ? "opacity-55" : undefined,
                        )}
                      >
                        <td className="px-3 py-2 text-foreground-heading">
                          {row.name || "-"}
                        </td>
                        <td className="px-3 py-2 text-foreground-subtitle">
                          {row.email || "-"}
                        </td>
                        <td className="px-3 py-2 text-foreground-muted">
                          {row.jobTitle || "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.duplicate ? (
                            <Badge variant="warning" size="sm">
                              Duplicado
                            </Badge>
                          ) : row.valid ? (
                            <Badge variant="success" size="sm" dot>
                              Pronto
                            </Badge>
                          ) : (
                            <Badge variant="error" size="sm">
                              Inválido
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}

function RoleSummary({
  role,
  store,
}: {
  role: AccessRole;
  store: ReturnType<typeof useAdminStore>;
}) {
  const categories = store.categories.filter((c) => role.categoryIds.includes(c.id));
  const extraCourses = store.courses.filter((c) => role.courseIds.includes(c.id));

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-regular border border-border-subtle bg-background-subtle/50 px-3 py-2.5">
      <span className="mr-1 text-[12px] font-medium text-foreground-muted">Libera:</span>
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
      {categories.length === 0 && extraCourses.length === 0 ? (
        <span className="text-[12px] text-foreground-muted">Nada liberado ainda.</span>
      ) : null}
    </div>
  );
}
