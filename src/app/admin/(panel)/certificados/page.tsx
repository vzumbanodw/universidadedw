"use client";

import Link from "next/link";
import { Award, BookOpen, ChevronRight, Settings } from "lucide-react";
import {
  AdminPageHeader,
  EmptyState,
  Panel,
  StatTile,
} from "@/components/admin/AdminPrimitives";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminStore } from "@/lib/admin/store";

/**
 * Certificados (operador). O certificado é emitido automaticamente quando o
 * aluno conclui TODOS os vídeos de um curso marcado com "Gera certificado".
 * Aqui o operador vê quais cursos emitem certificado e ajusta o modelo.
 */
export default function CertificadosPage() {
  const store = useAdminStore();
  const certCourses = store.courses.filter((c) => c.certificate);
  const publishedCount = store.courses.filter((c) => c.published).length;
  const cert = store.settings.certificate;

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <AdminPageHeader
        breadcrumb={[{ label: "Backoffice", href: "/admin" }, { label: "Certificados" }]}
        title="Certificados"
        description="Um curso emite certificado quando o aluno conclui TODOS os seus vídeos. Marque “Gera certificado” no curso e ajuste o modelo do certificado aqui."
        actions={
          <Link href="/admin/configuracoes">
            <Button variant="outline" leftIcon={<Settings className="h-4 w-4" />}>
              Editar modelo
            </Button>
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3">
        <StatTile icon={Award} label="Cursos com certificado" value={certCourses.length} />
        <StatTile icon={BookOpen} label="Cursos publicados" value={publishedCount} />
      </section>

      {/* Modelo do certificado */}
      <Panel className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
            Modelo do certificado
          </h2>
          <Link
            href="/admin/configuracoes"
            className="text-[13px] font-medium text-foreground-brand hover:underline"
          >
            Editar
          </Link>
        </div>
        <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
          <Field label="Instituição" value={cert.institutionName} />
          <Field label="Assinatura" value={`${cert.signatoryName} · ${cert.signatoryRole}`} />
        </dl>
        <p className="rounded-regular border border-border-subtle bg-background-subtle/50 px-3.5 py-2.5 text-[13px] italic text-foreground-muted">
          “{cert.baseText.replace(/\{curso\}/g, "[nome do curso]")}”
        </p>
        <p className="text-[12px] text-foreground-muted">
          O certificado do aluno mostra a logo Dataweb, o nome do funcionário, o
          curso e a data de conclusão.
        </p>
      </Panel>

      {/* Cursos que emitem certificado */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground-heading">
            Cursos que emitem certificado
          </h2>
          <Link href="/admin/cursos">
            <Button variant="outline" size="sm">
              Gerenciar cursos
            </Button>
          </Link>
        </div>

        {certCourses.length === 0 ? (
          <EmptyState
            icon={Award}
            title="Nenhum curso emite certificado"
            description="Edite um curso e marque “Gera certificado” para que ele libere um certificado ao concluir todos os vídeos."
            action={
              <Link href="/admin/cursos">
                <Button>Ir para cursos</Button>
              </Link>
            }
          />
        ) : (
          <Panel className="divide-y divide-border-subtle overflow-hidden">
            {certCourses.map((course) => (
              <Link
                key={course.id}
                href={`/admin/cursos/${course.id}`}
                className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-background-subtle sm:px-5"
              >
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-regular bg-brand-primary/10 text-brand-primary"
                >
                  <Award className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[14px] font-semibold text-foreground-heading">
                      {course.title}
                    </h3>
                    {!course.published ? (
                      <Badge variant="neutral" size="sm">
                        Rascunho
                      </Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-[12.5px] text-foreground-muted">
                    {course.categoryName}
                  </p>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            ))}
          </Panel>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-regular border border-border-subtle bg-background-elevated px-3 py-2">
      <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground-muted">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[13px] text-foreground-heading">{value}</dd>
    </div>
  );
}
