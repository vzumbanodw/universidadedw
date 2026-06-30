import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseCard } from "./CourseCard";
import { cn } from "@/lib/utils";
import type { Course } from "@/types/courses";

type CoursesSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  courses: Course[];
  seeAllHref?: string;
};

export function CoursesSection({
  eyebrow,
  title,
  description,
  courses,
  seeAllHref,
}: CoursesSectionProps) {
  return (
    <section aria-label={title} className="flex flex-col gap-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <span
            className={cn(
              "inline-flex h-5 items-center rounded-full border border-border-subtle bg-background-subtle px-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-foreground-muted",
            )}
          >
            {eyebrow}
          </span>
          <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-foreground-heading sm:text-[22px]">
            {title}
          </h2>
          <p className="mt-1 max-w-[68ch] text-[13.5px] text-foreground-muted">
            {description}
          </p>
        </div>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="hidden shrink-0 items-center gap-1 rounded-small px-2.5 py-1 text-[13px] font-medium text-foreground-subtitle transition-colors hover:bg-background-subtle hover:text-foreground sm:inline-flex"
          >
            Ver todos
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
