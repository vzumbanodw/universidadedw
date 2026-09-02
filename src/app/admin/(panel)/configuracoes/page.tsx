"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Check,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { AdminPageHeader, Panel } from "@/components/admin/AdminPrimitives";
import { MaturityLevelFormDialog } from "@/components/admin/MaturityLevelFormDialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminStore } from "@/lib/admin/store";
import { accentToBadge } from "@/lib/admin/badge";
import { cn } from "@/lib/utils";
import type { MaturityLevel } from "@/types/admin";

export default function ConfiguracoesPage() {
  const store = useAdminStore();

  return (
    <div className="mx-auto flex max-w-[980px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Backoffice", href: "/admin" }, { label: "Configurações" }]}
        title="Configurações"
        description="Pontuação, níveis de maturidade e o modelo dos certificados da Universidade."
      />

      {store.ready ? (
        <>
          <EmailDiagnosticsCard />
          <PointsSettingsCard />
          <CertificateSettingsCard />
          <MaturityLevelsCard />
        </>
      ) : (
        <Panel className="px-5 py-10 text-center text-foreground-muted">Carregando…</Panel>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Diagnóstico de e-mail                                                       */
/* -------------------------------------------------------------------------- */

type EmailStatus = {
  smtpConfigured: boolean;
  host: string;
  from: string;
  notifyTo: string[];
  appUrl: string;
};

/**
 * Mostra como o envio de e-mails está configurado no servidor e permite um
 * envio de teste — para diagnosticar rapidamente quando um aluno diz que não
 * recebeu o e-mail de acesso.
 */
function EmailDiagnosticsCard() {
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/email-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: EmailStatus | null) => {
        if (active && data) setStatus(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function sendTest() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/email-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; to?: string };
      setResult(
        res.ok && data.ok
          ? { ok: true, message: `E-mail de teste enviado para ${data.to}. Confira a caixa de entrada e o spam.` }
          : { ok: false, message: data.error ?? "Falha no envio." },
      );
    } catch {
      setResult({ ok: false, message: "Falha de rede." });
    } finally {
      setSending(false);
    }
  }

  return (
    <Panel className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
          Envio de e-mails
        </h2>
        <p className="mt-0.5 text-[13px] text-foreground-muted">
          Avisos de novas solicitações e links de criação de senha. Use o teste
          abaixo quando alguém disser que não recebeu o e-mail.
        </p>
      </div>

      {status ? (
        <dl className="grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2">
          <StatusRow
            label="Servidor de e-mail"
            value={status.smtpConfigured ? `Configurado (${status.host})` : "NÃO configurado"}
            tone={status.smtpConfigured ? "ok" : "error"}
          />
          <StatusRow
            label="Endereço público do app"
            value={status.appUrl || "NÃO configurado (links não são gerados)"}
            tone={status.appUrl ? "ok" : "error"}
          />
          <StatusRow label="Remetente" value={status.from || "—"} />
          <StatusRow label="Avisos internos para" value={status.notifyTo.join(", ") || "—"} />
        </dl>
      ) : (
        <p className="text-[13px] text-foreground-muted">Carregando…</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Enviar e-mail de teste para"
            type="email"
            placeholder="voce@dataweb.com.br"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            hint="Em branco: envia para o e-mail da sua conta de administrador."
          />
        </div>
        <Button variant="outline" onClick={sendTest} loading={sending}>
          Enviar teste
        </Button>
      </div>

      {result ? (
        <p
          role="alert"
          className={cn(
            "rounded-regular border px-3.5 py-2.5 text-[13px]",
            result.ok
              ? "border-border-success/40 bg-background-success text-foreground-success"
              : "border-border-error/60 bg-background-error text-foreground-error",
          )}
        >
          {result.message}
        </p>
      ) : null}
    </Panel>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "error";
}) {
  return (
    <div className="rounded-regular border border-border-subtle bg-background-subtle/40 px-3.5 py-2.5">
      <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground-muted">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 break-all text-[13px]",
          tone === "ok"
            ? "font-medium text-foreground-heading"
            : tone === "error"
              ? "font-semibold text-foreground-error"
              : "text-foreground-heading",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pontuação                                                                   */
/* -------------------------------------------------------------------------- */

function PointsSettingsCard() {
  const store = useAdminStore();
  const [perLesson, setPerLesson] = useState(
    store.settings.points.pointsPerLessonCompletion,
  );
  const [perCourse, setPerCourse] = useState(
    store.settings.points.pointsPerCourseCompletion,
  );
  const [saved, setSaved] = useSavedFlag();

  useEffect(() => {
    setPerLesson(store.settings.points.pointsPerLessonCompletion);
    setPerCourse(store.settings.points.pointsPerCourseCompletion);
  }, [store.settings.points]);

  function handleSave() {
    store.updateSettings({
      ...store.settings,
      points: {
        pointsPerLessonCompletion: Number(perLesson) || 0,
        pointsPerCourseCompletion: Number(perCourse) || 0,
      },
    });
    setSaved();
  }

  return (
    <SettingsCard
      icon={TrendingUp}
      title="Pontuação"
      description="Pontos concedidos automaticamente conforme o aluno avança."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Pontos por aula concluída"
          type="number"
          min={0}
          value={perLesson}
          onChange={(e) => setPerLesson(Number(e.target.value))}
        />
        <Input
          label="Pontos por curso concluído"
          type="number"
          min={0}
          value={perCourse}
          onChange={(e) => setPerCourse(Number(e.target.value))}
        />
      </div>
      <SaveRow saved={saved} onSave={handleSave} />
    </SettingsCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Certificado                                                                 */
/* -------------------------------------------------------------------------- */

function CertificateSettingsCard() {
  const store = useAdminStore();
  const [form, setForm] = useState(store.settings.certificate);
  const [saved, setSaved] = useSavedFlag();

  useEffect(() => {
    setForm(store.settings.certificate);
  }, [store.settings.certificate]);

  function handleSave() {
    store.updateSettings({ ...store.settings, certificate: form });
    setSaved();
  }

  return (
    <SettingsCard
      icon={Award}
      title="Modelo de certificado"
      description="Texto base e identificação da instituição. A geração do PDF será adicionada futuramente."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Instituição"
          value={form.institutionName}
          onChange={(e) => setForm((p) => ({ ...p, institutionName: e.target.value }))}
        />
        <Input
          label="Assinante"
          value={form.signatoryName}
          onChange={(e) => setForm((p) => ({ ...p, signatoryName: e.target.value }))}
        />
      </div>
      <Input
        label="Cargo do assinante"
        value={form.signatoryRole}
        onChange={(e) => setForm((p) => ({ ...p, signatoryRole: e.target.value }))}
      />
      <Textarea
        label="Texto base"
        hint="Use {curso} para inserir o nome do curso automaticamente."
        rows={3}
        value={form.baseText}
        onChange={(e) => setForm((p) => ({ ...p, baseText: e.target.value }))}
      />
      <SaveRow saved={saved} onSave={handleSave} />
    </SettingsCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Níveis de maturidade                                                        */
/* -------------------------------------------------------------------------- */

function MaturityLevelsCard() {
  const store = useAdminStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaturityLevel | null>(null);

  const levels = [...store.maturityLevels].sort((a, b) => a.order - b.order);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(level: MaturityLevel) {
    setEditing(level);
    setDialogOpen(true);
  }

  function handleDelete(level: MaturityLevel) {
    if (window.confirm(`Excluir o nível "${level.name}"?`)) {
      store.deleteMaturityLevel(level.id);
    }
  }

  return (
    <SettingsCard
      icon={GraduationCap}
      title="Níveis de maturidade"
      description="Faixas de pontuação que classificam a evolução de cada cliente."
      action={
        <Button size="sm" variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>
          Novo nível
        </Button>
      }
    >
      {levels.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-regular border border-dashed border-border-default py-8 text-center">
          <Layers className="h-6 w-6 text-foreground-muted" aria-hidden />
          <p className="text-[13px] text-foreground-muted">
            Nenhum nível configurado.
          </p>
          <Button size="sm" onClick={openNew}>
            Criar primeiro nível
          </Button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle">
          {levels.map((level) => (
            <div key={level.id} className="flex items-center gap-3 py-3">
              <Badge variant={accentToBadge(level.accent)} size="sm" dot>
                {level.name}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] text-foreground-muted">
                  {level.description || "Sem descrição."}
                </p>
              </div>
              <span className="shrink-0 text-[12px] tabular-nums text-foreground-muted">
                {level.minPoints}
                {level.maxPoints === null ? "+" : `–${level.maxPoints}`} pts
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <IconButton label="Editar nível" onClick={() => openEdit(level)}>
                  <Pencil className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton label="Excluir nível" variant="danger" onClick={() => handleDelete(level)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <MaturityLevelFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        level={editing}
      />
    </SettingsCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function useSavedFlag(): [boolean, () => void] {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!saved) return;
    const id = setTimeout(() => setSaved(false), 2200);
    return () => clearTimeout(id);
  }, [saved]);
  return [saved, () => setSaved(true)];
}

function SaveRow({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3">
      {saved ? (
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground-success animate-fade-in">
          <Check className="h-4 w-4" aria-hidden />
          Salvo
        </span>
      ) : null}
      <Button size="sm" onClick={onSave}>
        Salvar
      </Button>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: typeof Award;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Panel className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-regular bg-background-subtle text-foreground-subtitle"
          >
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
              {title}
            </h2>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-foreground-muted">
              {description}
            </p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </Panel>
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
        "inline-flex h-8 w-8 items-center justify-center rounded-regular border border-border-subtle bg-background-elevated transition-colors",
        variant === "danger"
          ? "text-foreground-muted hover:border-border-error hover:bg-background-error hover:text-foreground-error"
          : "text-foreground-muted hover:border-border-default hover:bg-background-subtle hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
