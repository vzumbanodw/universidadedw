import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, BookOpen, Clock } from "lucide-react";
import { CoursePlayer } from "@/components/courses/CoursePlayer";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { readContent } from "@/lib/content/store.server";
import { formatMinutes } from "@/lib/formatters";
import type { AdminCourse, AdminLesson } from "@/types/admin";
import type { CourseLesson } from "@/types/courses";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ courseSlug: string }>;
};

function slugOf(course: AdminCourse): string {
  return course.href.split("/").filter(Boolean).at(-1) ?? course.id;
}

async function findCourse(slug: string): Promise<AdminCourse | undefined> {
  const content = await readContent();
  return content.courses.find(
    (course) => course.published && slugOf(course) === slug,
  );
}

/** Converte a aula autorada (backoffice) no formato consumido pelo player. */
function toCourseLesson(lesson: AdminLesson): CourseLesson {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    durationMinutes: lesson.durationMinutes,
    completed: false,
    contentTitle: lesson.contentTitle,
    contentBlocks: lesson.contentBlocks,
    resources: lesson.resources.map((r) => ({ label: r.label, type: r.type })),
    videoUrl: lesson.videoUrl,
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = await findCourse(courseSlug);

  if (!course) {
    return { title: "Curso não encontrado · Universidade" };
  }

  return {
    title: `${course.title} · Cursos · Universidade`,
    description: course.description,
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseSlug } = await params;
  const course = await findCourse(courseSlug);

  if (!course) notFound();

  const content = await readContent();
  const lessons = content.lessons
    .filter((lesson) => lesson.courseId === course.id && lesson.published)
    .sort((a, b) => a.order - b.order)
    .map(toCourseLesson);

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
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
            href="/dashboard/cursos"
            className="transition-colors hover:text-foreground"
          >
            Cursos
          </Link>
          <span aria-hidden>/</span>
          <span className="min-w-0 truncate text-foreground-subtitle">
            {course.title}
          </span>
        </nav>

        {course.coverImageUrl ? (
          <div className="relative h-40 w-full overflow-hidden rounded-medium border border-border-subtle sm:h-48">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={course.coverImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm">
                {course.categoryName}
              </Badge>
              <Badge variant="info" size="sm">
                {course.level}
              </Badge>
              {course.certificate ? (
                <Badge variant="success" size="sm" dot>
                  Certificado
                </Badge>
              ) : null}
            </div>
            <h1 className="text-balance text-[26px] font-semibold leading-tight tracking-tight text-foreground-heading sm:text-[32px]">
              {course.title}
            </h1>
            <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-foreground-subtitle">
              {course.description}
            </p>
          </div>

          <aside className="rounded-medium border border-border-subtle bg-background-elevated p-4 shadow-elevation-sm">
            <div className="grid grid-cols-3 gap-3 text-[12px] text-foreground-muted">
              <Metric icon={<Clock className="h-3.5 w-3.5" />} label="Duração">
                {formatMinutes(course.estimatedMinutes)}
              </Metric>
              <Metric icon={<BookOpen className="h-3.5 w-3.5" />} label="Aulas">
                {lessons.length}
              </Metric>
              <Metric icon={<Award className="h-3.5 w-3.5" />} label="Formato">
                {course.format}
              </Metric>
            </div>
            <Progress
              value={course.progress}
              tone="primary"
              size="xs"
              className="mt-4"
              label="Progresso"
              showValue
            />
          </aside>
        </div>
      </header>

      {lessons.length > 0 ? (
        <CoursePlayer course={course} lessons={lessons} />
      ) : (
        <div className="rounded-medium border border-dashed border-border-default bg-background-elevated px-6 py-14 text-center">
          <p className="text-[14px] text-foreground-muted">
            Este curso ainda não tem aulas publicadas.
          </p>
        </div>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-regular border border-border-subtle bg-surface-muted/40 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-foreground-muted">
        {icon}
        <span className="truncate text-[10px] font-medium uppercase tracking-[0.1em]">
          {label}
        </span>
      </div>
      <p className="truncate text-[13px] font-semibold text-foreground-heading">
        {children}
      </p>
    </div>
  );
}
