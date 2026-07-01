import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { PrintCertificateButton } from "@/components/certificates/PrintCertificateButton";
import { readContent } from "@/lib/content/store.server";
import { getStudentProgress } from "@/lib/content/progress.server";
import { getCurrentStudent } from "@/lib/auth/student";
import { applicationProgress } from "@/lib/student-progress";
import { formatDate } from "@/lib/formatters";
import { slugify } from "@/lib/admin/options";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ categorySlug: string }> };

export const metadata: Metadata = {
  title: "Certificado de aplicação · Universidade",
};

const PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 0; }
  body * { visibility: hidden !important; }
  #certificate, #certificate * { visibility: visible !important; }
  #certificate {
    position: absolute; left: 0; top: 0; width: 100%;
    border: 0 !important; box-shadow: none !important; border-radius: 0 !important;
  }
}
`;

export default async function ApplicationCertificatePage({ params }: PageProps) {
  const { categorySlug } = await params;
  const content = await readContent();
  const category = content.categories.find(
    (c) => c.published && slugify(c.name) === categorySlug,
  );
  if (!category) notFound();

  const student = await getCurrentStudent();
  const rows = await getStudentProgress(student?.id);
  const progress = new Map(rows.map((r) => [r.lessonId, r.percent]));
  const dateByLesson = new Map(
    rows.filter((r) => r.completedAt).map((r) => [r.lessonId, r.completedAt as string]),
  );

  const { status, pct, courseCount } = applicationProgress(
    category.id,
    content.courses,
    content.lessons,
    progress,
  );
  const earned = status === "completed" && courseCount > 0;
  const studentName = student?.name ?? "Aluno";

  if (!earned) {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col items-center gap-5 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background-subtle text-foreground-muted">
          <Lock className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-foreground-heading">
            Certificado ainda não disponível
          </h1>
          <p className="mt-2 text-[14px] text-foreground-muted">
            Conclua <strong>todos os cursos</strong> da aplicação{" "}
            <strong>{category.name}</strong> para liberar o certificado ({pct}%
            concluído).
          </p>
        </div>
        <Link
          href={`/dashboard/aplicacoes/${categorySlug}`}
          className="inline-flex h-10 items-center gap-1.5 rounded-regular border border-border-default px-4 text-sm font-medium text-foreground-brand transition-colors hover:bg-background-subtle"
        >
          Ir para a aplicação
        </Link>
      </div>
    );
  }

  const earnedAtLessons = content.lessons.filter((l) => {
    const course = content.courses.find((c) => c.id === l.courseId);
    return (
      l.published &&
      Boolean(l.videoUrl) &&
      course?.published &&
      course.categoryId === category.id
    );
  });
  const earnedAt =
    earnedAtLessons
      .map((l) => dateByLesson.get(l.id))
      .filter((d): d is string => Boolean(d))
      .sort()
      .at(-1) ?? "";

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-5">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/dashboard/certificados"
          className="inline-flex items-center gap-1.5 text-[13px] text-foreground-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Voltar para certificados
        </Link>
        <PrintCertificateButton />
      </div>

      {/* Certificado — compacto e refinado, cores da Dataweb */}
      <div
        id="certificate"
        className="relative mx-auto w-full max-w-[760px] overflow-hidden rounded-medium border border-neutral-200 bg-white px-8 py-10 text-center shadow-elevation-md sm:px-14 sm:py-14"
      >
        {/* Faixa superior em degradê da marca */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-primary via-brand-tertiary to-brand-green"
        />
        {/* Moldura fina */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-3 rounded-[10px] border border-brand-primary/25"
        />

        <div className="relative flex flex-col items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dataweb.png" alt="Dataweb" className="h-9 w-auto" />

          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-primary">
            Certificado de Conclusão
          </p>

          <div className="flex flex-col items-center gap-2">
            <p className="text-[12px] uppercase tracking-[0.18em] text-neutral-500">
              Conferido a
            </p>
            <h1 className="text-balance text-[26px] font-semibold tracking-tight text-neutral-900 sm:text-[34px]">
              {studentName}
            </h1>
          </div>

          <p className="max-w-[52ch] text-[14px] leading-relaxed text-neutral-700">
            por concluir com aproveitamento{" "}
            <strong className="font-semibold text-brand-secondary">
              todos os cursos
            </strong>{" "}
            da aplicação{" "}
            <strong className="font-semibold text-brand-secondary">
              {category.name}
            </strong>{" "}
            na Universidade Dataweb.
          </p>

          <span
            aria-hidden
            className="my-1 inline-block h-1.5 w-1.5 rounded-full bg-brand-orange"
          />

          {earnedAt ? (
            <p className="text-[13px] text-neutral-500">
              Concluído em {formatDate(earnedAt)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
