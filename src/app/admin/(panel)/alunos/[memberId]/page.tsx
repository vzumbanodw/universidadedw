"use client";

import { use } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Mail,
  TrendingUp,
} from "lucide-react";
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
import { formatDate } from "@/lib/formatters";
import {
  ACCESS_LEVEL_LABEL,
  CERTIFICATE_STATUS_LABEL,
  MEMBER_STATUS_LABEL,
} from "@/types/admin";

export default function AlunoDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = use(params);
  const store = useAdminStore();

  const member = store.members.find((m) => m.id === memberId);

  if (store.ready && !member) {
    return (
      <div className="mx-auto max-w-[900px]">
        <EmptyState
          icon={GraduationCap}
          title="Aluno não encontrado"
          description="Ele pode ter sido removido. Volte para a lista de alunos."
          action={
            <Link href="/admin/alunos">
              <Button variant="outline">Voltar para alunos</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="mx-auto max-w-[900px] py-10 text-foreground-muted">Carregando…</div>
    );
  }

  const company = store.companies.find((c) => c.id === member.companyId);
  const role = store.roles.find((r) => r.id === member.roleId);
  const pointsPerCourse = store.settings.points.pointsPerCourseCompletion;
  const progress = deriveStudentProgress(member, store.courses, pointsPerCourse);
  const maturity = maturityForPoints(progress.totalPoints, store.maturityLevels);
  const certificates = certificatesForStudent(member, store.certificates);

  const inProgressCourses = store.courses.filter(
    (c) =>
      progress.startedCourseIds.includes(c.id) &&
      !progress.completedCourseIds.includes(c.id),
  );
  const completedCourses = store.courses.filter((c) =>
    progress.completedCourseIds.includes(c.id),
  );

  // Eventos recentes derivados (placeholder até `points_events` existir).
  const events: { label: string; date?: string }[] = [
    ...completedCourses.map((c) => ({ label: `Concluiu o curso "${c.title}"` })),
    ...certificates
      .filter((c) => c.status === "issued")
      .map((c) => ({ label: `Recebeu certificado de "${c.courseTitle}"`, date: c.issuedAt })),
  ].slice(0, 6);

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[
          { label: "Backoffice", href: "/admin" },
          { label: "Alunos", href: "/admin/alunos" },
          { label: member.name },
        ]}
        title={member.name}
        description={`${member.jobTitle || "Aluno"}${company ? ` · ${company.name}` : ""}`}
      />

      {/* Cabeçalho do aluno */}
      <Panel className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={member.name} size="lg" ring />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[13px] text-foreground-muted">
              <Mail className="h-3.5 w-3.5" aria-hidden />
              {member.email}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant="neutral" size="sm">
                {MEMBER_STATUS_LABEL[member.status]}
              </Badge>
              {role ? (
                <Badge variant="neutral" size="sm">
                  {role.name} · {ACCESS_LEVEL_LABEL[role.level]}
                </Badge>
              ) : null}
              {maturity ? (
                <Badge variant={accentToBadge(maturity.accent)} size="sm" dot>
                  {maturity.name}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <div className="sm:w-56">
          <Progress value={progress.overallProgress} label="Progresso geral" showValue tone="gradient" />
        </div>
      </Panel>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={BookOpen} label="Cursos iniciados" value={progress.startedCourseIds.length} />
        <StatTile icon={CheckCircle2} label="Cursos concluídos" value={completedCourses.length} />
        <StatTile icon={Award} label="Certificados" value={certificates.filter((c) => c.status === "issued").length} />
        <StatTile icon={TrendingUp} label="Pontuação" value={`${progress.totalPoints} pts`} />
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Cursos em andamento */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
            Cursos em andamento
          </h2>
          {inProgressCourses.length === 0 ? (
            <Panel className="px-4 py-6 text-center text-[13px] text-foreground-muted">
              Nenhum curso em andamento.
            </Panel>
          ) : (
            <Panel className="divide-y divide-border-subtle overflow-hidden">
              {inProgressCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/admin/cursos/${course.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-background-subtle"
                >
                  <BookOpen className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground-heading">
                    {course.title}
                  </span>
                  <span className="shrink-0 text-[12px] text-foreground-muted">
                    {course.categoryName}
                  </span>
                </Link>
              ))}
            </Panel>
          )}
        </section>

        {/* Cursos concluídos */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
            Cursos concluídos
          </h2>
          {completedCourses.length === 0 ? (
            <Panel className="px-4 py-6 text-center text-[13px] text-foreground-muted">
              Nenhum curso concluído ainda.
            </Panel>
          ) : (
            <Panel className="divide-y divide-border-subtle overflow-hidden">
              {completedCourses.map((course) => (
                <div key={course.id} className="flex items-center gap-3 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-foreground-success" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground-heading">
                    {course.title}
                  </span>
                </div>
              ))}
            </Panel>
          )}
        </section>
      </div>

      {/* Certificados */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
          Certificados
        </h2>
        {certificates.length === 0 ? (
          <Panel className="px-4 py-6 text-center text-[13px] text-foreground-muted">
            Este aluno ainda não possui certificados.
          </Panel>
        ) : (
          <Panel className="divide-y divide-border-subtle overflow-hidden">
            {certificates.map((cert) => (
              <div key={cert.id} className="flex items-center gap-3 px-4 py-3.5">
                <Award className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-foreground-heading">
                    {cert.courseTitle}
                  </p>
                  <p className="flex items-center gap-2 text-[12px] text-foreground-muted">
                    {cert.credentialId ? <span>{cert.credentialId}</span> : null}
                    {cert.issuedAt ? <span>{formatDate(cert.issuedAt)}</span> : null}
                  </p>
                </div>
                <Badge
                  variant={
                    cert.status === "issued"
                      ? "success"
                      : cert.status === "in_progress"
                        ? "orange"
                        : "neutral"
                  }
                  size="sm"
                >
                  {CERTIFICATE_STATUS_LABEL[cert.status]}
                </Badge>
              </div>
            ))}
          </Panel>
        )}
      </section>

      {/* Eventos recentes */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
          Histórico recente
        </h2>
        {events.length === 0 ? (
          <Panel className="px-4 py-6 text-center text-[13px] text-foreground-muted">
            Sem eventos registrados.
          </Panel>
        ) : (
          <Panel className="flex flex-col gap-0 divide-y divide-border-subtle overflow-hidden">
            {events.map((event, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3">
                <Clock className="h-3.5 w-3.5 shrink-0 text-foreground-muted" aria-hidden />
                <span className="min-w-0 flex-1 text-[13px] text-foreground">
                  {event.label}
                </span>
                {event.date ? (
                  <span className="shrink-0 text-[12px] text-foreground-muted">
                    {formatDate(event.date)}
                  </span>
                ) : null}
              </div>
            ))}
          </Panel>
        )}
      </section>
    </div>
  );
}
