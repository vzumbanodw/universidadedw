import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getCurrentStudent } from "@/lib/auth/student";
import type { CurrentUserView } from "@/components/auth/CurrentUserProvider";

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

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
