import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { PrintCertificateButton } from "@/components/certificates/PrintCertificateButton";
import { readContent } from "@/lib/content/store.server";
import { getStudentProgress } from "@/lib/content/progress.server";
import { getCurrentStudent } from "@/lib/auth/student";
import { courseCompletion, videoLessons } from "@/lib/student-progress";
import { formatDate, formatMinutes } from "@/lib/formatters";
import type { AdminCourse } from "@/types/admin";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ courseSlug: string }> };

function slugOf(course: AdminCourse): string {
  return course.href.split("/").filter(Boolean).at(-1) ?? course.id;
}

export const metadata: Metadata = {
  title: "Certificado · Universidade",
};

const PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 0; }
  html, body {
    width: 297mm !important; height: 210mm !important;
    margin: 0 !important; padding: 0 !important;
    overflow: hidden !important; background: #fff !important;
  }
  body * { visibility: hidden !important; }
  #certificate, #certificate * {
    visibility: visible !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  #certificate {
    position: fixed !important;
    left: 0 !important; top: 0 !important;
    width: 297mm !important; height: 210mm !important;
    max-width: none !important; margin: 0 !important;
    padding: 16mm !important; box-sizing: border-box !important;
    display: flex !important; flex-direction: column !important;
    align-items: center !important; justify-content: center !important;
    border: 0 !important; box-shadow: none !important; border-radius: 0 !important;
  }
}
`;

export default async function CertificatePage({ params }: PageProps) {
  const { courseSlug } = await params;
  const content = await readContent();
  const course = content.courses.find(
    (c) => c.published && c.certificate && slugOf(c) === courseSlug,
  );
  if (!course) notFound();

  const student = await getCurrentStudent();
  const rows = await getStudentProgress(student?.id);
  const progress = new Map(rows.map((r) => [r.lessonId, r.percent]));
  const dateByLesson = new Map(
    rows.filter((r) => r.completedAt).map((r) => [r.lessonId, r.completedAt as string]),
  );

  const cc = courseCompletion(course.id, content.lessons, progress);
  const earned = cc.total > 0 && cc.done === cc.total;

  // Página protegida por login (middleware); identidade vem do Auth.
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
            Conclua todos os vídeos do curso <strong>{course.title}</strong> para
            liberar o certificado ({cc.done}/{cc.total} concluídos).
          </p>
        </div>
        <Link
          href={course.href}
          className="inline-flex h-10 items-center gap-1.5 rounded-regular border border-border-default px-4 text-sm font-medium text-foreground-brand transition-colors hover:bg-background-subtle"
        >
          Ir para o curso
        </Link>
      </div>
    );
  }

  const earnedAt =
    videoLessons(content.lessons, course.id)
      .map((l) => dateByLesson.get(l.id))
      .filter((d): d is string => Boolean(d))
      .sort()
      .at(-1) ?? "";

  const settings = content.settings.certificate;
  const body = settings.baseText.replace(/\{curso\}/g, course.title);

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-5">
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

      {/* Certificado */}
      <div
        id="certificate"
        className="relative mx-auto flex w-full flex-col items-center overflow-hidden rounded-medium border border-border-default bg-white px-8 py-12 text-center shadow-elevation-md sm:px-16 sm:py-16"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-4 rounded-[10px] border-2 border-brand-primary/30"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[22px] rounded-[8px] border border-brand-secondary/20"
        />

        <div className="relative flex w-full max-w-[760px] flex-col items-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dataweb.png" alt="Dataweb" className="h-10 w-auto" />

          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-brand-primary">
              Certificado de Conclusão
            </p>
            <p className="mt-1 text-[13px] text-neutral-500">
              {settings.institutionName}
            </p>
          </div>

          <p className="text-[13px] uppercase tracking-[0.16em] text-neutral-500">
            Conferido a
          </p>
          <h1 className="text-balance text-[30px] font-semibold tracking-tight text-neutral-900 sm:text-[42px]">
            {studentName}
          </h1>

          <p className="max-w-[60ch] text-[15px] leading-relaxed text-neutral-700">
            {body}
          </p>

          <p className="text-[13px] text-neutral-500">
            Carga horária: {formatMinutes(course.estimatedMinutes)}
            {earnedAt ? ` · Concluído em ${formatDate(earnedAt)}` : ""}
          </p>

          <div className="mt-6 flex flex-col items-center gap-0.5 border-t border-neutral-300 px-8 pt-4">
            <p className="text-[15px] font-semibold text-neutral-800">
              {settings.signatoryName}
            </p>
            <p className="text-[12px] uppercase tracking-[0.16em] text-neutral-500">
              {settings.signatoryRole}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
