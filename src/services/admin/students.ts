import { readContent } from "@/lib/content/store.server";
import {
  certificatesForStudent,
  deriveStudentProgress,
  maturityForPoints,
  type StudentProgress,
} from "@/lib/admin/progress";
import type {
  CompanyMember,
  IssuedCertificate,
  MaturityLevel,
} from "@/types/admin";

/**
 * Service de alunos/clientes. Veja a nota de arquitetura em `./courses.ts`.
 *
 * No protótipo, os "alunos" são os membros das empresas (`members`). O
 * progresso ainda não é coletado, então é derivado de forma determinística
 * (`@/lib/admin/progress`). Equivalente Supabase: tabela `students` + agregação
 * de `student_course_progress` e `points_events`. RLS: aluno vê apenas o
 * próprio registro; operadores veem todos.
 */

export type StudentSummary = {
  member: CompanyMember;
  companyName: string;
  progress: StudentProgress;
  maturity: MaturityLevel | undefined;
  certificates: IssuedCertificate[];
};

export async function getStudents(): Promise<StudentSummary[]> {
  const state = await readContent();
  const pointsPerCourse = state.settings.points.pointsPerCourseCompletion;

  return state.members.map((member) => {
    const company = state.companies.find((c) => c.id === member.companyId);
    const progress = deriveStudentProgress(member, state.courses, pointsPerCourse);
    return {
      member,
      companyName: company?.name ?? "—",
      progress,
      maturity: maturityForPoints(progress.totalPoints, state.maturityLevels),
      certificates: certificatesForStudent(member, state.certificates),
    };
  });
}

export async function getStudentById(
  id: string,
): Promise<StudentSummary | null> {
  const students = await getStudents();
  return students.find((s) => s.member.id === id) ?? null;
}

export async function getStudentProgress(
  id: string,
): Promise<StudentProgress | null> {
  const student = await getStudentById(id);
  return student?.progress ?? null;
}
