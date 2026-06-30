"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/lib/admin/store";
import { createId } from "@/lib/admin/options";
import type { CompanyMember } from "@/types/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type MemberFormDialogProps = {
  open: boolean;
  onClose: () => void;
  companyId: string;
  member?: CompanyMember | null;
};

/**
 * Cadastro de um funcionário (um por vez) — nome e email. O cargo é opcional.
 * Depois de cadastrado, o operador gera o acesso (login/senha) pelo botão de
 * chave na lista. Todos os funcionários têm acesso a todo o conteúdo.
 */
export function MemberFormDialog({ open, onClose, companyId, member }: MemberFormDialogProps) {
  const store = useAdminStore();
  const editing = Boolean(member);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(member?.name ?? "");
    setEmail(member?.email ?? "");
    setJobTitle(member?.jobTitle ?? "");
  }, [open, member]);

  function handleSave() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName) {
      setError("Informe o nome do funcionário.");
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Informe um email válido.");
      return;
    }
    const duplicate = store
      .membersForCompany(companyId)
      .some((m) => m.email.toLowerCase() === trimmedEmail && m.id !== member?.id);
    if (duplicate) {
      setError("Já existe um funcionário com esse email nesta empresa.");
      return;
    }

    const jobTitleValue = jobTitle.trim() || undefined;

    if (member) {
      store.upsertMember({
        ...member,
        name: trimmedName,
        email: trimmedEmail,
        jobTitle: jobTitleValue,
      });
    } else {
      store.upsertMember({
        id: createId("mb"),
        companyId,
        name: trimmedName,
        email: trimmedEmail,
        jobTitle: jobTitleValue,
        status: "invited",
        createdAt: new Date().toISOString(),
      });
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={editing ? "Editar funcionário" : "Adicionar funcionário"}
      description={
        editing
          ? "Atualize os dados deste funcionário."
          : "Cadastre o funcionário com nome e email. Depois clique na chave na lista para gerar o login e a senha."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} leftIcon={<UserPlus className="h-4 w-4" />}>
            {editing ? "Salvar" : "Adicionar"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p
            role="alert"
            className="rounded-regular border border-border-error bg-background-error px-3.5 py-2.5 text-sm text-foreground-error"
          >
            {error}
          </p>
        ) : null}

        <Input
          label="Nome do funcionário"
          required
          name="member-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Maria Silva"
        />
        <Input
          label="Email"
          required
          type="email"
          name="member-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="maria.silva@empresa.com.br"
        />
        <Input
          label="Cargo (opcional)"
          name="member-job"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Vendedora"
        />
      </div>
    </Modal>
  );
}
