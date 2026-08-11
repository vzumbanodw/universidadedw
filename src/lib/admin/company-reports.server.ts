import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseServiceClient,
  hasServiceRole,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { readContent } from "@/lib/content/store.server";

/**
 * Relatórios POR EMPRESA com dados REAIS:
 *
 *   - usuários cadastrados/ativos → cadastro de funcionários (backoffice);
 *   - frequência de acesso → último login das contas (Supabase Auth) e
 *     atividade em aulas (`lesson_completions`) nos últimos 30 dias;
 *   - cursos iniciados/concluídos → aulas realmente concluídas pelos alunos;
 *   - certificados emitidos → registros com status "issued";
 *   - nível de utilização → % das aulas publicadas concluídas pela equipe
 *     (total de aulas concluídas ÷ (funcionários × aulas publicadas)).
 *
 * Sem Supabase (dev em arquivo), as métricas de atividade ficam zeradas e
 * `realData` sinaliza isso para a interface.
 */

export type CompanyReportRow = {
  companyId: string;
  companyName: string;
  cnpj?: string;
  registeredUsers: number;
  activeUsers: number;
  /** Usuários com login OU atividade em aula nos últimos 30 dias. */
  accessLast30d: number;
  coursesStarted: number;
  coursesCompleted: number;
  certificatesIssued: number;
  utilizationPct: number;
  utilizationLabel: "Alto" | "Médio" | "Baixo" | "—";
};

export type CompanyReports = {
  rows: CompanyReportRow[];
  /** true quando logins e conclusões vieram do Supabase (produção). */
  realData: boolean;
  generatedAt: string;
};

type CompletionRow = {
  student_id: string;
  lesson_id: string;
  course_id: string | null;
  completed_at: string | null;
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function db(): SupabaseClient {
  return createSupabaseServiceClient() as unknown as SupabaseClient;
}

/** Todas as conclusões de aula (paginado — o PostgREST limita a 1000/página). */
async function fetchCompletions(): Promise<CompletionRow[] | null> {
  const all: CompletionRow[] = [];
  const PAGE = 1000;
  for (let from = 0; from < 100_000; from += PAGE) {
    const { data, error } = await db()
      .from("lesson_completions")
      .select("student_id, lesson_id, course_id, completed_at")
      .range(from, from + PAGE - 1);
    if (error) return null; // tabela ausente/erro: sem dados reais
    all.push(...((data ?? []) as CompletionRow[]));
    if (!data || data.length < PAGE) break;
  }
  return all;
}

/** Último login por conta do Auth (paginado). */
async function fetchLastSignIns(): Promise<Map<string, number> | null> {
  const map = new Map<string, number>();
  const api = (createSupabaseServiceClient() as unknown as SupabaseClient).auth.admin;
  for (let page = 1; page <= 25; page += 1) {
    const { data, error } = await api.listUsers({ page, perPage: 200 });
    if (error) return null;
    const users = data?.users ?? [];
    users.forEach((u) => {
      if (u.last_sign_in_at) map.set(u.id, new Date(u.last_sign_in_at).getTime());
    });
    if (users.length < 200) break;
  }
  return map;
}

function utilizationLabel(pct: number): CompanyReportRow["utilizationLabel"] {
  if (pct >= 60) return "Alto";
  if (pct >= 30) return "Médio";
  if (pct > 0) return "Baixo";
  return "—";
}

export async function buildCompanyReports(): Promise<CompanyReports> {
  const content = await readContent();

  // Aulas publicadas por curso (só cursos publicados com ao menos 1 aula).
  const lessonsByCourse = new Map<string, Set<string>>();
  const courseOfLesson = new Map<string, string>();
  const publishedCourseIds = new Set(
    content.courses.filter((c) => c.published).map((c) => c.id),
  );
  content.lessons.forEach((lesson) => {
    if (!publishedCourseIds.has(lesson.courseId)) return;
    if (!lessonsByCourse.has(lesson.courseId)) {
      lessonsByCourse.set(lesson.courseId, new Set());
    }
    lessonsByCourse.get(lesson.courseId)!.add(lesson.id);
    courseOfLesson.set(lesson.id, lesson.courseId);
  });
  const totalPublishedLessons = courseOfLesson.size;

  // Dados reais de atividade (produção).
  let completions: CompletionRow[] | null = null;
  let lastSignIns: Map<string, number> | null = null;
  if (isSupabaseConfigured() && hasServiceRole()) {
    [completions, lastSignIns] = await Promise.all([
      fetchCompletions(),
      fetchLastSignIns(),
    ]);
  }
  const realData = completions !== null && lastSignIns !== null;

  // Conclusões agrupadas por aluno (student_id = conta do Auth).
  const byStudent = new Map<string, CompletionRow[]>();
  (completions ?? []).forEach((row) => {
    const list = byStudent.get(row.student_id) ?? [];
    list.push(row);
    byStudent.set(row.student_id, list);
  });

  const now = Date.now();

  const rows: CompanyReportRow[] = content.companies.map((company) => {
    const members = content.members.filter((m) => m.companyId === company.id);
    const emails = new Set(members.map((m) => m.email.toLowerCase()));

    let accessLast30d = 0;
    let coursesStarted = 0;
    let coursesCompleted = 0;
    let lessonsCompletedTotal = 0;

    members.forEach((member) => {
      const authId = member.authUserId;
      const mine = authId ? (byStudent.get(authId) ?? []) : [];

      // Aulas concluídas por curso (deduplicadas e restritas a aulas publicadas).
      const perCourse = new Map<string, Set<string>>();
      let lastActivity = 0;
      mine.forEach((row) => {
        const courseId = courseOfLesson.get(row.lesson_id) ?? row.course_id;
        if (!courseId || !lessonsByCourse.has(courseId)) return;
        if (!lessonsByCourse.get(courseId)!.has(row.lesson_id)) return;
        if (!perCourse.has(courseId)) perCourse.set(courseId, new Set());
        perCourse.get(courseId)!.add(row.lesson_id);
        if (row.completed_at) {
          lastActivity = Math.max(lastActivity, new Date(row.completed_at).getTime());
        }
      });

      perCourse.forEach((doneLessons, courseId) => {
        lessonsCompletedTotal += doneLessons.size;
        coursesStarted += 1;
        if (doneLessons.size >= lessonsByCourse.get(courseId)!.size) {
          coursesCompleted += 1;
        }
      });

      const lastSignIn = authId ? (lastSignIns?.get(authId) ?? 0) : 0;
      if (now - Math.max(lastSignIn, lastActivity) <= THIRTY_DAYS_MS && (lastSignIn || lastActivity)) {
        accessLast30d += 1;
      }
    });

    const certificatesIssued = content.certificates.filter(
      (c) => c.status === "issued" && emails.has(c.studentEmail.toLowerCase()),
    ).length;

    const utilizationPct =
      members.length > 0 && totalPublishedLessons > 0
        ? Math.round(
            (lessonsCompletedTotal / (members.length * totalPublishedLessons)) * 100,
          )
        : 0;

    return {
      companyId: company.id,
      companyName: company.name,
      cnpj: company.cnpj,
      registeredUsers: members.length,
      activeUsers: members.filter((m) => m.status === "active").length,
      accessLast30d,
      coursesStarted,
      coursesCompleted,
      certificatesIssued,
      utilizationPct,
      utilizationLabel: utilizationLabel(utilizationPct),
    };
  });

  rows.sort((a, b) => a.companyName.localeCompare(b.companyName, "pt-BR"));

  return { rows, realData, generatedAt: new Date().toISOString() };
}
