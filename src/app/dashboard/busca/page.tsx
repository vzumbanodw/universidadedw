import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { CourseCard } from "@/components/courses/CourseCard";
import {
  TrackCategoryCard,
} from "@/components/tracks/TrackCategoryCard";
import { readContent } from "@/lib/content/store.server";
import { getStudentProgress } from "@/lib/content/progress.server";
import { getCurrentStudent } from "@/lib/auth/student";
import {
  applicationProgress,
  categoryWithRealProgress,
  courseWithRealProgress,
} from "@/lib/student-progress";

export const metadata: Metadata = {
  title: "Busca · Universidade",
  description: "Resultados da busca por aplicações e cursos.",
};

export const dynamic = "force-dynamic";

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const term = q.trim().toLowerCase();

  const content = await readContent();
  const student = await getCurrentStudent();
  const rows = await getStudentProgress(student?.id);
  const progress = new Map(rows.map((r) => [r.lessonId, r.percent]));

  const has = (value: string | undefined) =>
    (value ?? "").toLowerCase().includes(term);

  const categories = term
    ? content.categories
        .filter((c) => c.published && (has(c.name) || has(c.tagline)))
        .map((c) => {
          const withProgress = categoryWithRealProgress(
            c,
            content.courses,
            content.lessons,
            progress,
          );
          const { status } = applicationProgress(
            c.id,
            content.courses,
            content.lessons,
            progress,
          );
          return { ...withProgress, status };
        })
    : [];

  const courses = term
    ? content.courses
        .filter(
          (c) =>
            c.published &&
            (has(c.title) || has(c.categoryName) || has(c.description)),
        )
        .map((c) => courseWithRealProgress(c, content.lessons, progress))
    : [];

  const total = categories.length + courses.length;

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8">
      <header className="flex flex-col gap-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-[12px] text-foreground-muted"
        >
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground-subtitle">Busca</span>
        </nav>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground-heading sm:text-[30px]">
          Busca
        </h1>
        {term ? (
          <p className="text-[14px] text-foreground-subtitle">
            <strong className="font-semibold tabular-nums text-foreground">
              {total}
            </strong>{" "}
            {total === 1 ? "resultado" : "resultados"} para{" "}
            <strong className="font-semibold text-foreground">“{q.trim()}”</strong>
          </p>
        ) : (
          <p className="text-[14px] text-foreground-subtitle">
            Digite algo na busca do topo para encontrar aplicações e cursos.
          </p>
        )}
      </header>

      {!term ? null : total === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-large border border-dashed border-border-default bg-background-elevated px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-medium bg-brand-primary/10 text-brand-primary">
            <Search className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground-heading">
            Nenhum resultado
          </h2>
          <p className="max-w-[44ch] text-[13.5px] leading-relaxed text-foreground-muted">
            Não encontramos aplicações ou cursos para “{q.trim()}”. Tente outro
            termo.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {categories.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-[15px] font-semibold uppercase tracking-[0.12em] text-foreground-muted">
                Aplicações ({categories.length})
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => (
                  <TrackCategoryCard key={category.id} category={category} />
                ))}
              </div>
            </section>
          ) : null}

          {courses.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-[15px] font-semibold uppercase tracking-[0.12em] text-foreground-muted">
                Cursos ({courses.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
