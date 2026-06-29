"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/lib/admin/store";
import { createId } from "@/lib/admin/options";
import {
  CERTIFICATE_STATUS_LABEL,
  type IssuedCertificate,
  type IssuedCertificateStatus,
} from "@/types/admin";

type CertificateFormDialogProps = {
  open: boolean;
  onClose: () => void;
  certificate?: IssuedCertificate | null;
};

type FormState = {
  studentName: string;
  studentEmail: string;
  companyName: string;
  courseId: string;
  courseTitle: string;
  status: IssuedCertificateStatus;
  workloadMinutes: number;
  credentialId: string;
  issuedAt: string;
};

const EMPTY: FormState = {
  studentName: "",
  studentEmail: "",
  companyName: "",
  courseId: "",
  courseTitle: "",
  status: "issued",
  workloadMinutes: 60,
  credentialId: "",
  issuedAt: new Date().toISOString().slice(0, 10),
};

const STATUS_OPTIONS = (
  Object.keys(CERTIFICATE_STATUS_LABEL) as IssuedCertificateStatus[]
).map((value) => ({ value, label: CERTIFICATE_STATUS_LABEL[value] }));

export function CertificateFormDialog({
  open,
  onClose,
  certificate,
}: CertificateFormDialogProps) {
  const store = useAdminStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      certificate
        ? {
            studentName: certificate.studentName,
            studentEmail: certificate.studentEmail,
            companyName: certificate.companyName ?? "",
            courseId: certificate.courseId ?? "",
            courseTitle: certificate.courseTitle,
            status: certificate.status,
            workloadMinutes: certificate.workloadMinutes,
            credentialId: certificate.credentialId ?? "",
            issuedAt: certificate.issuedAt?.slice(0, 10) ?? "",
          }
        : EMPTY,
    );
  }, [open, certificate]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function pickCourse(courseId: string) {
    const course = store.courses.find((c) => c.id === courseId);
    setForm((prev) => ({
      ...prev,
      courseId,
      courseTitle: course?.title ?? prev.courseTitle,
      workloadMinutes: course?.estimatedMinutes ?? prev.workloadMinutes,
    }));
  }

  function pickStudent(email: string) {
    const member = store.members.find((m) => m.email === email);
    if (!member) return;
    const company = store.companies.find((c) => c.id === member.companyId);
    setForm((prev) => ({
      ...prev,
      studentName: member.name,
      studentEmail: member.email,
      companyName: company?.name ?? prev.companyName,
    }));
  }

  function handleSave() {
    if (!form.studentName.trim() || !form.studentEmail.trim()) {
      setError("Informe o nome e o e-mail do aluno.");
      return;
    }
    if (!form.courseTitle.trim()) {
      setError("Selecione ou informe o curso do certificado.");
      return;
    }

    const next: IssuedCertificate = {
      id: certificate?.id ?? createId("cert"),
      studentName: form.studentName.trim(),
      studentEmail: form.studentEmail.trim(),
      companyName: form.companyName.trim() || undefined,
      courseId: form.courseId || undefined,
      courseTitle: form.courseTitle.trim(),
      status: form.status,
      progress: certificate?.progress,
      workloadMinutes: Number(form.workloadMinutes) || 0,
      credentialId: form.credentialId.trim() || undefined,
      issuedAt:
        form.status === "issued"
          ? form.issuedAt || new Date().toISOString().slice(0, 10)
          : undefined,
    };

    store.upsertCertificate(next);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={certificate ? "Editar certificado" : "Registrar certificado"}
      description="Emita ou registre um certificado para um aluno. A geração do PDF será adicionada futuramente."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {certificate ? "Salvar alterações" : "Registrar"}
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

        {store.members.length > 0 ? (
          <Select
            label="Aluno (atalho)"
            placeholder="Selecionar de um aluno existente"
            value={form.studentEmail}
            onChange={(e) => pickStudent(e.target.value)}
            options={store.members.map((m) => ({ value: m.email, label: `${m.name} · ${m.email}` }))}
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nome do aluno"
            required
            value={form.studentName}
            onChange={(e) => update("studentName", e.target.value)}
          />
          <Input
            label="E-mail"
            required
            type="email"
            value={form.studentEmail}
            onChange={(e) => update("studentEmail", e.target.value)}
          />
        </div>

        <Input
          label="Empresa"
          value={form.companyName}
          onChange={(e) => update("companyName", e.target.value)}
        />

        {store.courses.length > 0 ? (
          <Select
            label="Curso"
            placeholder="Selecionar curso"
            value={form.courseId}
            onChange={(e) => pickCourse(e.target.value)}
            options={store.courses.map((c) => ({ value: c.id, label: c.title }))}
          />
        ) : (
          <Input
            label="Curso"
            required
            value={form.courseTitle}
            onChange={(e) => update("courseTitle", e.target.value)}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => update("status", e.target.value as IssuedCertificateStatus)}
            options={STATUS_OPTIONS}
          />
          <Input
            label="Carga horária (min)"
            type="number"
            min={0}
            value={form.workloadMinutes}
            onChange={(e) => update("workloadMinutes", Number(e.target.value))}
          />
          <Input
            label="Emitido em"
            type="date"
            value={form.issuedAt}
            onChange={(e) => update("issuedAt", e.target.value)}
            disabled={form.status !== "issued"}
          />
        </div>

        <Input
          label="ID da credencial"
          placeholder="Ex.: DW-CRM-2026-001"
          value={form.credentialId}
          onChange={(e) => update("credentialId", e.target.value)}
        />
      </div>
    </Modal>
  );
}
