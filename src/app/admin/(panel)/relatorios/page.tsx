"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  BarChart3,
  Building2,
  Download,
  FileSpreadsheet,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { AdminPageHeader, Panel } from "@/components/admin/AdminPrimitives";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Progress } from "@/components/ui/Progress";
import { useAdminStore } from "@/lib/admin/store";
import { deriveStudentProgress, maturityForPoints } from "@/lib/admin/progress";
import { accentToBadge } from "@/lib/admin/badge";
import type { CompanyReportRow } from "@/lib/admin/company-reports.server";

const UTILIZATION_BADGE: Record<string, "success" | "orange" | "neutral"> = {
  Alto: "success",
  Médio: "orange",
  Baixo: "neutral",
  "—": "neutral",
};

/** Linhas do relatório com cabeçalhos pt-BR para exportação. */
function toExportRows(rows: CompanyReportRow[]) {
  return rows.map((r) => ({
    Empresa: r.companyName,
    CNPJ: r.cnpj ?? "",
    "Usuários cadastrados": r.registeredUsers,
    "Usuários ativos": r.activeUsers,
    "Com acesso nos últimos 30 dias": r.accessLast30d,
    "Cursos iniciados": r.coursesStarted,
    "Cursos concluídos": r.coursesCompleted,
    "Certificados emitidos": r.certificatesIssued,
    "Utilização (%)": r.utilizationPct,
    "Nível de utilização": r.utilizationLabel,
  }));
}

async function exportReport(rows: CompanyReportRow[], format: "xlsx" | "csv") {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.json_to_sheet(toExportRows(rows));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Relatório por empresa");
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(book, `relatorio-empresas-universidade-${date}.${format}`, {
    bookType: format,
  });
}

export default function RelatoriosPage() {
  const store = useAdminStore();
  const [reportRows, setReportRows] = useState<CompanyReportRow[]>([]);
  const [reportReal, setReportReal] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState("all");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/reports/companies")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { rows?: CompanyReportRow[]; realData?: boolean } | null) => {
        if (!active || !data) return;
        setReportRows(data.rows ?? []);
        setReportReal(data.realData ?? false);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReportLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleReportRows = useMemo(
    () =>
      companyFilter === "all"
        ? reportRows
        : reportRows.filter((r) => r.companyId === companyFilter),
    [reportRows, companyFilter],
  );

  const data = useMemo(() => {
    const pointsPerCourse = store.settings.points.pointsPerCourseCompletion;
    const progresses = store.members.map((member) => ({
      member,
      progress: deriveStudentProgress(member, store.courses, pointsPerCourse),
    }));

    // Conclusão por curso
    const courseStats = store.courses
      .filter((c) => c.published)
      .map((course) => {
        let started = 0;
        let completed = 0;
        progresses.forEach(({ progress }) => {
          if (progress.startedCourseIds.includes(course.id)) started += 1;
          if (progress.completedCourseIds.includes(course.id)) completed += 1;
        });
        return {
          course,
          started,
          completed,
          rate: started > 0 ? Math.round((completed / started) * 100) : 0,
        };
      })
      .filter((s) => s.started > 0);

    const byRate = [...courseStats].sort((a, b) => b.rate - a.rate);
    const topCourses = byRate.slice(0, 5);
    const lowCourses = [...byRate].reverse().slice(0, 5);

    // Alunos mais ativos
    const activeStudents = [...progresses]
      .sort((a, b) => b.progress.totalPoints - a.progress.totalPoints)
      .slice(0, 5);

    // Clientes com baixa atividade
    const lowActivity = [...progresses]
      .filter(({ progress }) => progress.overallProgress < 20)
      .slice(0, 5);

    // Maturidade
    const maturityCounts = new Map<string, number>();
    progresses.forEach(({ progress }) => {
      const level = maturityForPoints(progress.totalPoints, store.maturityLevels);
      if (level) maturityCounts.set(level.id, (maturityCounts.get(level.id) ?? 0) + 1);
    });

    const totalPoints = progresses.reduce((s, p) => s + p.progress.totalPoints, 0);

    return { topCourses, lowCourses, activeStudents, lowActivity, maturityCounts, totalPoints };
  }, [store.members, store.courses, store.maturityLevels, store.settings]);

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Backoffice", href: "/admin" }, { label: "Relatórios" }]}
        title="Relatórios"
        description="Visão consolidada de conclusão, engajamento e evolução dos clientes na Universidade."
      />

      {/* ---------- Relatórios por empresa (dados reais) ---------- */}
      <Panel className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-foreground-muted" aria-hidden />
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
              Relatórios por empresa
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FileSpreadsheet className="h-4 w-4" />}
              disabled={visibleReportRows.length === 0}
              onClick={() => exportReport(visibleReportRows, "xlsx")}
            >
              Exportar Excel
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              disabled={visibleReportRows.length === 0}
              onClick={() => exportReport(visibleReportRows, "csv")}
            >
              Exportar CSV
            </Button>
          </div>
        </div>

        <div className="max-w-[360px]">
          <Select
            label="Empresa"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            options={[
              { value: "all", label: "Todas as empresas" },
              ...reportRows.map((r) => ({ value: r.companyId, label: r.companyName })),
            ]}
          />
        </div>

        {!reportReal && !reportLoading ? (
          <p className="rounded-regular border border-border-subtle bg-background-subtle/50 px-3.5 py-2.5 text-[12.5px] text-foreground-muted">
            Ambiente sem Supabase: acessos e conclusões de aula aparecem zerados
            (em produção os números são reais).
          </p>
        ) : null}

        {reportLoading ? (
          <p className="py-6 text-center text-[13px] text-foreground-muted">Carregando…</p>
        ) : visibleReportRows.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-foreground-muted">
            Nenhuma empresa cadastrada ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border-subtle text-[11.5px] uppercase tracking-[0.08em] text-foreground-muted">
                  <th className="py-2 pr-4 font-medium">Empresa</th>
                  <th className="px-3 py-2 text-right font-medium">Cadastrados</th>
                  <th className="px-3 py-2 text-right font-medium">Ativos</th>
                  <th className="px-3 py-2 text-right font-medium" title="Usuários com login ou atividade em aulas nos últimos 30 dias">
                    Acesso 30 dias
                  </th>
                  <th className="px-3 py-2 text-right font-medium">Cursos iniciados</th>
                  <th className="px-3 py-2 text-right font-medium">Cursos concluídos</th>
                  <th className="px-3 py-2 text-right font-medium">Certificados</th>
                  <th className="py-2 pl-3 font-medium" title="Percentual das aulas publicadas concluídas pela equipe">
                    Utilização
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {visibleReportRows.map((row) => (
                  <tr key={row.companyId} className="text-[13px] text-foreground">
                    <td className="max-w-[220px] py-2.5 pr-4">
                      <p className="truncate font-medium text-foreground-heading">
                        {row.companyName}
                      </p>
                      {row.cnpj ? (
                        <p className="truncate text-[11.5px] text-foreground-muted">
                          {row.cnpj}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.registeredUsers}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.activeUsers}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.accessLast30d}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.coursesStarted}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.coursesCompleted}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.certificatesIssued}</td>
                    <td className="py-2.5 pl-3">
                      <span className="inline-flex items-center gap-2">
                        <Badge variant={UTILIZATION_BADGE[row.utilizationLabel]} size="sm" dot>
                          {row.utilizationLabel}
                        </Badge>
                        <span className="text-[12px] tabular-nums text-foreground-muted">
                          {row.utilizationPct}%
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Cursos com maior conclusão */}
        <ReportPanel
          icon={TrendingUp}
          title="Cursos com maior conclusão"
          empty={data.topCourses.length === 0}
        >
          {data.topCourses.map(({ course, rate, completed, started }) => (
            <CourseRow
              key={course.id}
              title={course.title}
              detail={`${completed}/${started} · ${rate}%`}
              rate={rate}
            />
          ))}
        </ReportPanel>

        {/* Cursos com menor conclusão */}
        <ReportPanel
          icon={TrendingDown}
          title="Cursos com menor conclusão"
          empty={data.lowCourses.length === 0}
        >
          {data.lowCourses.map(({ course, rate, completed, started }) => (
            <CourseRow
              key={course.id}
              title={course.title}
              detail={`${completed}/${started} · ${rate}%`}
              rate={rate}
              tone="orange"
            />
          ))}
        </ReportPanel>

        {/* Alunos mais ativos */}
        <ReportPanel
          icon={Users}
          title="Alunos mais ativos"
          empty={data.activeStudents.length === 0}
        >
          {data.activeStudents.map(({ member, progress }) => (
            <Link
              key={member.id}
              href={`/admin/alunos/${member.id}`}
              className="flex items-center justify-between gap-3 py-1.5 transition-colors hover:text-foreground"
            >
              <span className="min-w-0 truncate text-[13.5px] text-foreground-heading">
                {member.name}
              </span>
              <span className="shrink-0 text-[12.5px] font-semibold tabular-nums text-foreground-muted">
                {progress.totalPoints} pts
              </span>
            </Link>
          ))}
        </ReportPanel>

        {/* Clientes com baixa atividade */}
        <ReportPanel
          icon={TrendingDown}
          title="Clientes com baixa atividade"
          empty={data.lowActivity.length === 0}
          emptyLabel="Todos os clientes estão engajados."
        >
          {data.lowActivity.map(({ member, progress }) => (
            <Link
              key={member.id}
              href={`/admin/alunos/${member.id}`}
              className="flex items-center justify-between gap-3 py-1.5 transition-colors hover:text-foreground"
            >
              <span className="min-w-0 truncate text-[13.5px] text-foreground-heading">
                {member.name}
              </span>
              <span className="shrink-0 text-[12.5px] tabular-nums text-foreground-muted">
                {progress.overallProgress}%
              </span>
            </Link>
          ))}
        </ReportPanel>
      </div>

      {/* Evolução de pontuação / maturidade */}
      <Panel className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-foreground-muted" aria-hidden />
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
            Maturidade dos clientes
          </h2>
          <span className="ml-auto text-[12.5px] text-foreground-muted">
            {data.totalPoints.toLocaleString("pt-BR")} pts acumulados
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {[...store.maturityLevels]
            .sort((a, b) => a.order - b.order)
            .map((level) => (
              <div
                key={level.id}
                className="flex flex-col gap-1.5 rounded-regular border border-border-subtle bg-background-subtle/40 p-3"
              >
                <Badge variant={accentToBadge(level.accent)} size="sm" dot>
                  {level.name}
                </Badge>
                <span className="text-[22px] font-semibold tabular-nums text-foreground-heading">
                  {data.maturityCounts.get(level.id) ?? 0}
                </span>
                <span className="text-[11px] text-foreground-muted">
                  {level.minPoints}
                  {level.maxPoints === null ? "+" : `–${level.maxPoints}`} pts
                </span>
              </div>
            ))}
        </div>
      </Panel>
    </div>
  );
}

function ReportPanel({
  icon: Icon,
  title,
  empty,
  emptyLabel = "Sem dados suficientes ainda.",
  children,
}: {
  icon: typeof Award;
  title: string;
  empty: boolean;
  emptyLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Panel className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-foreground-muted" aria-hidden />
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
          {title}
        </h2>
      </div>
      {empty ? (
        <p className="py-4 text-center text-[13px] text-foreground-muted">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle">{children}</div>
      )}
    </Panel>
  );
}

function CourseRow({
  title,
  detail,
  rate,
  tone = "primary",
}: {
  title: string;
  detail: string;
  rate: number;
  tone?: "primary" | "orange";
}) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-[13.5px] font-medium text-foreground-heading">
          {title}
        </span>
        <span className="shrink-0 text-[12px] tabular-nums text-foreground-muted">{detail}</span>
      </div>
      <Progress value={rate} tone={tone} />
    </div>
  );
}
