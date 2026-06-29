import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CoursesSection } from "@/components/courses/CoursesSection";
import { Badge } from "@/components/ui/Badge";
import { readContent } from "@/lib/content/store.server";
import { slugify } from "@/lib/admin/options";
import type { AdminCategory } from "@/types/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ categorySlug: string }>;
};

/** Casa o slug da URL com a categoria pelo nome (mesma regra do card). */
async function findCategory(slug: string): Promise<AdminCategory | undefined> {
  const content = await readContent();
  return content.categories.find(
    (category) => category.published && slugify(category.name) === slug,
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await findCategory(categorySlug);

  if (!category) {
    return { title: "Trilha não encontrada · Universidade" };
  }

  return {
    title: `${category.name} · Trilhas · Universidade`,
    description: category.tagline,
  };
}

export default async function TrackCategoryDetailPage({ params }: PageProps) {
  const { categorySlug } = await params;
  const content = await readContent();
  const category = content.categories.find(
    (c) => c.published && slugify(c.name) === categorySlug,
  );

  if (!category) notFound();

  const courses = content.courses.filter(
    (course) => course.published && course.categoryId === category.id,
  );

  const typeLabel = category.type === "aplicacao" ? "Aplicação" : "Módulo";

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-8">
      <header className="flex flex-col gap-5">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-[12px] text-foreground-muted"
        >
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <span aria-hidden>/</span>
          <Link
            href="/dashboard/trilhas"
            className="transition-colors hover:text-foreground"
          >
            Trilhas
          </Link>
          <span aria-hidden>/</span>
          <span className="min-w-0 truncate text-foreground-subtitle">
            {category.name}
          </span>
        </nav>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {category.coverImageUrl ? (
            <div className="mx-auto w-36 shrink-0 sm:mx-0 sm:w-44">
              <div className="aspect-[1280/1808] overflow-hidden rounded-medium border border-border-subtle shadow-elevation-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={category.coverImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm">
                {typeLabel}
              </Badge>
              <Badge variant="info" size="sm">
                {courses.length} {courses.length === 1 ? "curso" : "cursos"}
              </Badge>
            </div>
            <h1 className="text-balance text-[26px] font-semibold leading-tight tracking-tight text-foreground-heading sm:text-[32px]">
              {category.name}
            </h1>
            <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-foreground-subtitle">
              {category.tagline}
            </p>
          </div>
        </div>
      </header>

      {courses.length > 0 ? (
        <CoursesSection
          eyebrow={typeLabel}
          title={`Cursos de ${category.name}`}
          description="Cursos e módulos publicados nesta categoria."
          courses={courses}
        />
      ) : (
        <div className="rounded-medium border border-dashed border-border-default bg-background-elevated px-6 py-14 text-center">
          <p className="text-[14px] text-foreground-muted">
            Nenhum curso publicado nesta categoria ainda. Adicione cursos a esta
            aplicação/módulo no backoffice para que apareçam aqui.
          </p>
          <Link
            href="/dashboard/trilhas"
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-primary transition-colors hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Voltar para Trilhas
          </Link>
        </div>
      )}
    </div>
  );
}
