"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Award, GraduationCap, Search, TrendingUp, Users } from "lucide-react";
import {
  AdminPageHeader,
  EmptyState,
  Panel,
  StatTile,
} from "@/components/admin/AdminPrimitives";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { useAdminStore } from "@/lib/admin/store";
import {
  certificatesForStudent,
  deriveStudentProgress,
  maturityForPoints,
} from "@/lib/admin/progress";
import { accentToBadge } from "@/lib/admin/badge";

export default function AlunosPage() {
  const store = useAdminStore();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const pointsPerCourse = store.settings.points.pointsPerCourseCompletion;
    return store.members.map((member) => {
      const company = store.companies.find((c) => c.id === member.companyId);
      const progress = deriveStudentProgress(member, store.courses, pointsPerCourse);
      const maturity = maturityForPoints(progress.totalPoints, store.maturityLevels);
      const certificates = certificatesForStudent(member, store.certificates);
      return { member, company, progress, maturity, certificates };
    });
  }, [store.members, store.companies, store.courses, store.maturityLevels, store.certificates, store.settings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.member.name.toLowerCase().includes(q) ||
        r.member.email.toLowerCase().includes(q) ||
        (r.company?.name.toLowerCase().includes(q) ?? false),
    );
  }, [rows, query]);

  const avgProgress =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + r.progress.overallProgress, 0) / rows.length)
      : 0;
  const totalCertificates = rows.reduce(
    (s, r) => s + r.certificates.filter((c) => c.status === "issued").length,
    0,
  );

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Backoffice", href: "/admin" }, { label: "Alunos & Progresso" }]}
        title="Alunos & Progresso"
        description="Acompanhe o progresso, a pontuação e a maturidade dos clientes que usam a Universidade."
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Users} label="Alunos" value={store.members.length} />
        <StatTile icon={TrendingUp} label="Progresso médio" value={`${avgProgress}%`} />
        <StatTile icon={Award} label="Certificados" value={totalCertificates} />
        <StatTile icon={GraduationCap} label="Empresas" value={store.companies.length} />
      </section>

      <div className="relative flex h-10 items-center rounded-regular border border-border-subtle bg-background-elevated transition-colors focus-within:border-foreground-subtitle">
        <Search aria-hidden className="ml-3 h-4 w-4 text-foreground-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, e-mail ou empresa..."
          aria-label="Buscar alunos"
          className="flex-1 bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-foreground-muted outline-none"
        />
      </div>

      {store.members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum aluno ainda"
          description="Cadastre empresas e adicione usuários para acompanhar o progresso aqui."
          action={
            <Link href="/admin/empresas">
              <Button>Ir para empresas</Button>
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum aluno encontrado"
          description="Ajuste a busca para encontrar o aluno."
        />
      ) : (
        <Panel className="divide-y divide-border-subtle overflow-hidden">
          {filtered.map(({ member, company, progress, maturity, certificates }) => (
            <Link
              key={member.id}
              href={`/admin/alunos/${member.id}`}
              className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-background-subtle sm:flex-row sm:items-center sm:gap-4 sm:px-5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={member.name} size="sm" />
                <div className="min-w-0">
                  <h3 className="truncate text-[14px] font-semibold text-foreground-heading">
                    {member.name}
                  </h3>
                  <p className="truncate text-[12.5px] text-foreground-muted">
                    {member.email}
                    {company ? <span> · {company.name}</span> : null}
                  </p>
                </div>
              </div>

              <div className="flex w-full items-center gap-4 sm:w-auto">
                <div className="w-32 shrink-0">
                  <Progress value={progress.overallProgress} showValue />
                </div>
                <span className="hidden w-20 shrink-0 text-right text-[13px] font-semibold tabular-nums text-foreground-heading sm:block">
                  {progress.totalPoints} pts
                </span>
                {maturity ? (
                  <Badge variant={accentToBadge(maturity.accent)} size="sm" dot>
                    {maturity.name}
                  </Badge>
                ) : null}
                <span className="hidden items-center gap-1 text-[12.5px] text-foreground-muted md:inline-flex">
                  <Award className="h-3.5 w-3.5" aria-hidden />
                  {certificates.filter((c) => c.status === "issued").length}
                </span>
              </div>
            </Link>
          ))}
        </Panel>
      )}
    </div>
  );
}
