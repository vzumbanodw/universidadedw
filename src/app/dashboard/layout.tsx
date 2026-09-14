import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCurrentStudent } from "@/lib/auth/student";
import { readContent } from "@/lib/content/store.server";
import type { CurrentUserView } from "@/components/auth/CurrentUserProvider";
import type { AnnouncedCourse } from "@/components/courses/NewCourseModal";

/** Quantos cursos recentes alimentam o aviso de novidade (payload enxuto). */
const ANNOUNCE_LIMIT = 12;

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const student = await getCurrentStudent();
  const user: CurrentUserView | null = student
    ? {
        name: student.name,
        firstName: student.firstName,
        email: student.email,
        role: student.companyName
          ? `${student.role} · ${student.companyName}`
          : student.role,
      }
    : null;

  // Cursos publicados mais recentes: o aviso de "novo curso" compara esta
  // lista com o que o aluno já viu (controle no próprio navegador).
  const content = await readContent();
  const newCourses: AnnouncedCourse[] = content.courses
    .filter((course) => course.published)
    .slice()
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, ANNOUNCE_LIMIT)
    .map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      categoryName: course.categoryName,
      href: course.href,
      coverImageUrl: course.coverImageUrl,
      lessonsCount: course.lessonsCount,
      estimatedMinutes: course.estimatedMinutes,
    }));

  return (
    <DashboardShell user={user} newCourses={newCourses}>
      {children}
    </DashboardShell>
  );
}
