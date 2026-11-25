"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronDown,
  FileSpreadsheet,
  Download,
  Gauge,
  MessageSquareHeart,
  Percent,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import {
  AdminPageHeader,
  EmptyState,
  Panel,
  StatTile,
} from "@/components/admin/AdminPrimitives";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAdminStore } from "@/lib/admin/store";
import { cn } from "@/lib/utils";
import {
  MIN_COMPLETED_LESSONS,
  RATING_MAX,
  RATING_MIN,
  RENEWAL_MONTHS,
  SURVEY_QUESTIONS,
  SURVEY_SHORT_LABELS,
  nextSurveyDate,
  ratingTone,
  type SurveyResponse,
} from "@/lib/satisfaction/survey";
import type { CompanyMember } from "@/types/admin";

const NO_COMPANY = "__sem-empresa__";

const TONE_BADGE = { high: "success", mid: "warning", low: "error" } as const;

const RATING_FILTERS = [
  { value: "all", label: "Todas as notas" },
  { value: "high", label: "Notas 8 a 10" },
  { value: "mid", label: "Notas 5 a 7" },
  { value: "low", label: "Notas 1 a 4" },
];

type CompanyGroup = {
  key: string;
  companyId?: string;
  name: string;
  responses: SurveyResponse[];
  /** Funcionários ativos/convidados da empresa que ainda não responderam. */
  pending: CompanyMember[];
  eligible: number;
  average: number | null;
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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function formatAverage(value: number | null): string {
  return value === null ? "—" : value.toFixed(1).replace(".", ",");
}

async function exportResponses(
  rows: { response: SurveyResponse; companyName: string }[],
  format: "xlsx" | "csv",
) {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.json_to_sheet(
    rows.map(({ response: r, companyName }) => ({
      Empresa: companyName,
      Nome: r.studentName,
      "E-mail": r.studentEmail,
      "Respondido em": formatDateTime(r.createdAt),
      Resposta: `${r.round}ª`,
      [SURVEY_QUESTIONS.mostHelpfulLesson]: r.mostHelpfulLesson,
      [SURVEY_QUESTIONS.missingTopic]: r.missingTopic,
      [`${SURVEY_QUESTIONS.easeRating} (1 a 10)`]: r.easeRating,
      [SURVEY_QUESTIONS.improvement]: r.improvement,
    })),
  );
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Pesquisa de satisfação");
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(book, `pesquisa-satisfacao-universidade-${date}.${format}`, {
    bookType: format,
  });
}

/** Respostas da Pesquisa de Satisfação, organizadas por empresa e pessoa. */
export default function PesquisaPage() {
  const store = useAdminStore();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [missingTable, setMissingTable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [toDelete, setToDelete] = useState<SurveyResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function removeResponse(response: SurveyResponse) {
    setDeleteError(null);
    const res = await fetch(
      `/api/admin/satisfaction?id=${encodeURIComponent(response.id)}`,
      { method: "DELETE" },
    ).catch(() => null);
    if (!res?.ok) {
      const data = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
      setDeleteError(data?.error ?? "Não foi possível remover a resposta. Tente novamente.");
      return;
    }
    setResponses((current) => current.filter((r) => r.id !== response.id));
  }

  // Resposta mais recente de cada pessoa: é dela que sai a data da próxima pesquisa.
  const latestIds = useMemo(() => {
    const latest = new Map<string, SurveyResponse>();
    for (const r of responses) {
      const current = latest.get(r.studentId);
      if (!current || r.round > current.round) latest.set(r.studentId, r);
    }
    return new Set([...latest.values()].map((r) => r.id));
  }, [responses]);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/satisfaction")
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as {
          responses?: SurveyResponse[];
          missingTable?: boolean;
          error?: string;
        };
        if (!active) return;
        if (!r.ok) {
          setLoadError(data.error ?? "Não foi possível carregar as respostas.");
          return;
        }
        setResponses(data.responses ?? []);
        setMissingTable(Boolean(data.missingTable));
      })
      .catch(() => {
        if (active) setLoadError("Falha de rede ao carregar as respostas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Empresa ATUAL da pessoa (segue transferências); a gravada na resposta é o fallback.
  const companyKeyFor = useMemo(() => {
    const byEmail = new Map(
      store.members.map((m) => [m.email.toLowerCase(), m.companyId]),
    );
    return (r: SurveyResponse) =>
      byEmail.get(r.studentEmail.toLowerCase()) ?? r.companyId ?? NO_COMPANY;
  }, [store.members]);

  const companyName = useMemo(() => {
    const names = new Map(store.companies.map((c) => [c.id, c.name]));
    return (key: string, fallback?: string) =>
      names.get(key) ?? fallback ?? "Sem empresa vinculada";
  }, [store.companies]);

  const groups = useMemo<CompanyGroup[]>(() => {
    const respondedEmails = new Set(responses.map((r) => r.studentEmail.toLowerCase()));
    const map = new Map<string, CompanyGroup>();

    const ensure = (key: string, fallbackName?: string) => {
      let group = map.get(key);
      if (!group) {
        const members = store.members.filter(
          (m) => m.companyId === key && m.status !== "suspended",
        );
        group = {
          key,
          companyId: key === NO_COMPANY ? undefined : key,
          name: companyName(key, fallbackName),
          responses: [],
          pending: members.filter((m) => !respondedEmails.has(m.email.toLowerCase())),
          eligible: members.length,
          average: null,
        };
        map.set(key, group);
      }
      return group;
    };

    for (const r of responses) ensure(companyKeyFor(r), r.companyName).responses.push(r);
    for (const company of store.companies) ensure(company.id);

    return [...map.values()]
      .map((g) => ({ ...g, average: average(g.responses.map((r) => r.easeRating)) }))
      .sort(
        (a, b) =>
          b.responses.length - a.responses.length || a.name.localeCompare(b.name, "pt-BR"),
      );
  }, [responses, store.members, store.companies, companyKeyFor, companyName]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleGroups = useMemo(
    () =>
      groups
        .filter((g) => companyFilter === "all" || g.key === companyFilter)
        .map((g) => ({
          ...g,
          responses: g.responses.filter((r) => {
            if (ratingFilter !== "all" && ratingTone(r.easeRating) !== ratingFilter) {
              return false;
            }
            if (!normalizedQuery) return true;
            return [
              r.studentName,
              r.studentEmail,
              g.name,
              r.mostHelpfulLesson,
              r.missingTopic,
              r.improvement,
            ].some((field) => field.toLowerCase().includes(normalizedQuery));
          }),
        }))
        .filter((g) => g.responses.length > 0),
    [groups, companyFilter, ratingFilter, normalizedQuery],
  );

  const withoutResponses = groups.filter(
    (g) => g.responses.length === 0 && g.eligible > 0,
  );

  // Métricas gerais (sempre sobre o total, independentemente dos filtros).
  const eligibleMembers = store.members.filter((m) => m.status !== "suspended");
  const eligibleTotal = eligibleMembers.length;
  const respondedEmails = new Set(responses.map((r) => r.studentEmail.toLowerCase()));
  // Só conta quem está na base hoje (removidos/suspensos inflariam a taxa).
  const eligibleResponded = eligibleMembers.filter((m) =>
    respondedEmails.has(m.email.toLowerCase()),
  ).length;
  const overallAverage = average(responses.map((r) => r.easeRating));
  const participatingCompanies = groups.filter(
    (g) => g.responses.length > 0 && g.key !== NO_COMPANY,
  ).length;
  const responseRate =
    eligibleTotal > 0 ? Math.round((eligibleResponded / eligibleTotal) * 100) : null;

  const exportRows = visibleGroups.flatMap((g) =>
    g.responses.map((response) => ({ response, companyName: g.name })),
  );

  const companyOptions = [
    { value: "all", label: "Todas as empresas" },
    ...groups
      .filter((g) => g.responses.length > 0)
      .map((g) => ({ value: g.key, label: `${g.name} (${g.responses.length})` })),
  ];

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Backoffice", href: "/admin" }, { label: "Pesquisa de satisfação" }]}
        title="Pesquisa de satisfação"
        description={`Respostas dos alunos, organizadas por empresa e pessoa. A pesquisa é obrigatória a partir de ${MIN_COMPLETED_LESSONS} aulas concluídas e volta ${RENEWAL_MONTHS} meses depois de cada resposta — cada envio fica registrado aqui.`}
        actions={
          responses.length > 0 ? (
            <>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FileSpreadsheet className="h-4 w-4" />}
                onClick={() => exportResponses(exportRows, "xlsx")}
                disabled={exportRows.length === 0}
              >
                Exportar Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => exportResponses(exportRows, "csv")}
                disabled={exportRows.length === 0}
              >
                Exportar CSV
              </Button>
            </>
          ) : null
        }
      />

      {deleteError ? (
        <p
          role="alert"
          className="rounded-regular border border-border-error bg-background-error px-3.5 py-2.5 text-sm text-foreground-error"
        >
          {deleteError}
        </p>
      ) : null}

      {loading ? (
        <p className="py-10 text-center text-[13px] text-foreground-muted">Carregando…</p>
      ) : loadError ? (
        <EmptyState icon={MessageSquareHeart} title="Erro ao carregar" description={loadError} />
      ) : missingTable ? (
        <EmptyState
          icon={MessageSquareHeart}
          title="A pesquisa ainda não foi ativada"
          description="Rode a migration 0015_satisfaction_survey.sql no Supabase. Até lá, o formulário não aparece para os alunos."
        />
      ) : responses.length === 0 ? (
        <EmptyState
          icon={MessageSquareHeart}
          title="Nenhuma resposta ainda"
          description={`A pesquisa aparece, obrigatória, para quem já concluiu ${MIN_COMPLETED_LESSONS} aulas. As respostas chegam aqui, identificadas por pessoa e empresa.`}
        />
      ) : (
        <>
          <section
            aria-label="Resumo da pesquisa"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <StatTile icon={MessageSquareHeart} label="Respostas" value={responses.length} />
            <StatTile
              icon={Gauge}
              label={`Nota média (de ${RATING_MIN} a ${RATING_MAX})`}
              value={formatAverage(overallAverage)}
            />
            <StatTile icon={Building2} label="Empresas participantes" value={participatingCompanies} />
            <StatTile
              icon={Percent}
              label={`${eligibleResponded} de ${eligibleTotal} responderam`}
              value={responseRate === null ? "—" : `${responseRate}%`}
            />
          </section>

          <RatingDistribution responses={responses} />

          <Panel className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-end">
            <Input
              aria-label="Buscar"
              placeholder="Buscar por pessoa, e-mail, empresa ou resposta"
              startIcon={<Search className="h-4 w-4" />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="lg:flex-1"
            />
            <Select
              aria-label="Empresa"
              options={companyOptions}
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="lg:w-[260px]"
            />
            <Select
              aria-label="Nota"
              options={RATING_FILTERS}
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="lg:w-[180px]"
            />
          </Panel>

          {visibleGroups.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhuma resposta com esses filtros"
              description="Ajuste a busca, a empresa ou a faixa de nota."
            />
          ) : (
            <div className="flex flex-col gap-5">
              {visibleGroups.map((group) => (
                <CompanyResponses
                  key={group.key}
                  group={group}
                  latestIds={latestIds}
                  onDelete={setToDelete}
                />
              ))}
            </div>
          )}

          {companyFilter === "all" && withoutResponses.length > 0 ? (
            <WithoutResponses groups={withoutResponses} />
          ) : null}
        </>
      )}

      <DeleteConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Remover resposta"
        description={
          toDelete
            ? `A ${toDelete.round}ª resposta de ${toDelete.studentName} (${toDelete.studentEmail}), enviada em ${formatDateTime(toDelete.createdAt)}, será apagada.${
                latestIds.has(toDelete.id)
                  ? " Como é a mais recente, a pesquisa volta a aparecer para essa pessoa na próxima entrada."
                  : ""
              }`
            : ""
        }
        target={`pesquisa de satisfação: ${toDelete?.round ?? ""}ª resposta de ${toDelete?.studentEmail ?? ""}`}
        confirmLabel="Remover resposta"
        onConfirmed={() => (toDelete ? removeResponse(toDelete) : undefined)}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function RatingDistribution({ responses }: { responses: SurveyResponse[] }) {
  const counts = Array.from({ length: RATING_MAX - RATING_MIN + 1 }, (_, i) => {
    const rating = RATING_MIN + i;
    return { rating, count: responses.filter((r) => r.easeRating === rating).length };
  });
  const max = Math.max(1, ...counts.map((c) => c.count));

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
          Facilidade de navegação
        </h2>
        <p className="text-[12px] text-foreground-muted">
          Quantas pessoas deram cada nota · 1 = muito difícil, 10 = muito fácil
        </p>
      </div>
      <div className="mt-5 grid h-[148px] grid-cols-10 items-end gap-1.5 sm:gap-3">
        {counts.map(({ rating, count }) => (
          <div key={rating} className="flex h-full flex-col items-center justify-end gap-1.5">
            <span
              className={cn(
                "text-[12px] font-semibold tabular-nums",
                count ? "text-foreground-heading" : "text-foreground-disabled",
              )}
            >
              {count}
            </span>
            <div
              className={cn(
                "w-full rounded-t-[4px] transition-[height] duration-700",
                count ? "bg-brand-primary" : "bg-border-subtle",
              )}
              style={{ height: count ? `${(count / max) * 100}%` : "3px" }}
              title={`${count} ${count === 1 ? "pessoa" : "pessoas"} deram nota ${rating}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-10 gap-1.5 border-t border-border-subtle pt-2 sm:gap-3">
        {counts.map(({ rating }) => (
          <span
            key={rating}
            className="text-center text-[12px] tabular-nums text-foreground-muted"
          >
            {rating}
          </span>
        ))}
      </div>
    </Panel>
  );
}

function CompanyResponses({
  group,
  latestIds,
  onDelete,
}: {
  group: CompanyGroup;
  latestIds: Set<string>;
  onDelete: (response: SurveyResponse) => void;
}) {
  const [showPending, setShowPending] = useState(false);
  // Pessoas (não registros): quem respondeu 2 vezes conta uma vez só.
  const respondedShare =
    group.eligible > 0
      ? Math.min(
          100,
          Math.round(((group.eligible - group.pending.length) / group.eligible) * 100),
        )
      : null;

  return (
    <Panel className="overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-border-subtle bg-background-subtle/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-regular bg-brand-primary/10 text-brand-primary"
          >
            <Building2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            {group.companyId ? (
              <Link
                href={`/admin/empresas/${group.companyId}`}
                className="block truncate text-[15px] font-semibold tracking-tight text-foreground-heading underline-offset-4 hover:underline"
              >
                {group.name}
              </Link>
            ) : (
              <p className="truncate text-[15px] font-semibold tracking-tight text-foreground-heading">
                {group.name}
              </p>
            )}
            <p className="text-[12.5px] text-foreground-muted">
              {group.responses.length}{" "}
              {group.responses.length === 1 ? "resposta" : "respostas"}
              {group.eligible > 0
                ? ` · ${group.eligible - group.pending.length} de ${group.eligible} alunos responderam`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {respondedShare !== null ? (
            <div className="hidden w-[120px] sm:block" aria-hidden>
              <div className="h-1.5 overflow-hidden rounded-full bg-border-subtle">
                <div
                  className="h-full rounded-full bg-brand-primary"
                  style={{ width: `${respondedShare}%` }}
                />
              </div>
            </div>
          ) : null}
          <div className="text-right">
            <p className="text-[18px] font-semibold leading-none tabular-nums text-foreground-heading">
              {formatAverage(group.average)}
            </p>
            <p className="mt-1 text-[11px] text-foreground-muted">nota média</p>
          </div>
        </div>
      </header>

      <ul className="divide-y divide-border-subtle">
        {group.responses.map((response) => (
          <ResponseRow
            key={response.id}
            response={response}
            isLatest={latestIds.has(response.id)}
            onDelete={() => onDelete(response)}
          />
        ))}
      </ul>

      {group.pending.length > 0 ? (
        <div className="border-t border-border-subtle px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => setShowPending((v) => !v)}
            aria-expanded={showPending}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-foreground-brand underline-offset-4 hover:underline"
          >
            <Users className="h-3.5 w-3.5" aria-hidden />
            {showPending ? "Ocultar" : "Ver"} quem ainda não respondeu ({group.pending.length})
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", showPending && "rotate-180")}
              aria-hidden
            />
          </button>
          {showPending ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {group.pending.map((member) => (
                <li
                  key={member.id}
                  className="rounded-full border border-border-subtle bg-background-subtle px-3 py-1 text-[12.5px] text-foreground-subtitle"
                  title={member.email}
                >
                  {member.name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}

function ResponseRow({
  response,
  isLatest,
  onDelete,
}: {
  response: SurveyResponse;
  /** É a resposta mais recente da pessoa (mostra quando a pesquisa volta). */
  isLatest: boolean;
  onDelete: () => void;
}) {
  const next = isLatest ? nextSurveyDate(response.createdAt) : null;
  const tone = ratingTone(response.easeRating);
  const answers = [
    { label: SURVEY_SHORT_LABELS.mostHelpfulLesson, value: response.mostHelpfulLesson },
    { label: SURVEY_SHORT_LABELS.missingTopic, value: response.missingTopic },
    { label: SURVEY_SHORT_LABELS.improvement, value: response.improvement },
  ];

  return (
    <li className="flex flex-col gap-4 px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={response.studentName} size="sm" />
          <div className="min-w-0">
            <p className="flex min-w-0 items-center gap-2 text-[14px] font-semibold text-foreground-heading">
              <span className="truncate">{response.studentName}</span>
              <span className="shrink-0 rounded-full border border-border-subtle bg-background-subtle px-2 py-px text-[11px] font-medium text-foreground-subtitle">
                {response.round}ª resposta
              </span>
            </p>
            <p className="truncate text-[12px] text-foreground-muted">
              {response.studentEmail} · {formatDateTime(response.createdAt)}
            </p>
            {next ? (
              <p className="mt-0.5 text-[12px] text-foreground-muted">
                {next.getTime() > Date.now()
                  ? `Próxima pesquisa a partir de ${formatDate(next)}`
                  : "Já pode responder a próxima pesquisa"}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant={TONE_BADGE[tone]} title={SURVEY_SHORT_LABELS.easeRating}>
            <span className="tabular-nums">
              {response.easeRating}/{RATING_MAX}
            </span>
          </Badge>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Remover a resposta de ${response.studentName}`}
            title="Remover resposta"
            className="flex h-8 w-8 items-center justify-center rounded-regular text-foreground-muted transition-colors hover:bg-background-error hover:text-foreground-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-error"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {answers.map((answer) => (
          <div
            key={answer.label}
            className="rounded-regular border border-border-subtle bg-background-subtle/50 px-3.5 py-3"
          >
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground-muted">
              {answer.label}
            </dt>
            <dd
              className={cn(
                "mt-1.5 whitespace-pre-line break-words text-[13.5px] leading-relaxed",
                answer.value ? "text-foreground" : "italic text-foreground-disabled",
              )}
            >
              {answer.value || "Não respondeu"}
            </dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

function WithoutResponses({ groups }: { groups: CompanyGroup[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Panel className="px-4 py-3.5 sm:px-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-[13.5px] font-medium text-foreground-heading">
          {groups.length} {groups.length === 1 ? "empresa ainda sem respostas" : "empresas ainda sem respostas"}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-foreground-muted transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {groups.map((g) => (
            <li key={g.key}>
              <Link
                href={`/admin/empresas/${g.key}`}
                className="inline-flex rounded-full border border-border-subtle bg-background-subtle px-3 py-1 text-[12.5px] text-foreground-subtitle transition-colors hover:border-border-default hover:text-foreground-heading"
              >
                {g.name} · {g.eligible} {g.eligible === 1 ? "aluno" : "alunos"}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </Panel>
  );
}
