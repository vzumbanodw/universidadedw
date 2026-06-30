import type {
  AdminCourse,
  CompanyMember,
  IssuedCertificate,
  MaturityLevel,
} from "@/types/admin";

/**
 * Camada de progresso/pontuação do aluno.
 *
 * Enquanto o backend (Supabase) não estiver conectado, o progresso real ainda
 * não é coletado. Para que as telas de Alunos, Relatórios e Maturidade exibam
 * dados consistentes e estáveis (não aleatórios a cada render), derivamos um
 * progresso determinístico a partir do id do membro.
 *
 * Quando as tabelas `student_course_progress` / `student_lesson_progress` /
 * `points_events` existirem, basta substituir `deriveStudentProgress` por uma
 * consulta a esses dados — a interface `StudentProgress` permanece a mesma.
 */

export type StudentProgress = {
  /** Cursos com ao menos uma aula concluída. */
  startedCourseIds: string[];
  /** Cursos 100% concluídos. */
  completedCourseIds: string[];
  /** Progresso geral médio (0-100). */
  overallProgress: number;
  /** Pontuação acumulada. */
  totalPoints: number;
};

/** Hash estável e simples (FNV-1a) para gerar progresso determinístico. */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Pseudo-aleatório determinístico em [0, 1) a partir de uma semente. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function deriveStudentProgress(
  member: CompanyMember,
  courses: AdminCourse[],
  pointsPerCourse = 100,
): StudentProgress {
  const publishedCourses = courses.filter((c) => c.published);
  const base = hashString(member.id);

  const startedCourseIds: string[] = [];
  const completedCourseIds: string[] = [];
  let progressSum = 0;

  publishedCourses.forEach((course, index) => {
    const roll = seededRandom(base + index * 97);
    // Membros suspensos/convidados engajam menos.
    const engagement = member.status === "active" ? roll : roll * 0.4;
    if (engagement > 0.35) {
      startedCourseIds.push(course.id);
      if (engagement > 0.7) {
        completedCourseIds.push(course.id);
        progressSum += 100;
      } else {
        progressSum += Math.round(engagement * 90);
      }
    }
  });

  const overallProgress =
    publishedCourses.length > 0
      ? Math.round(progressSum / publishedCourses.length)
      : 0;

  const totalPoints =
    completedCourseIds.length * pointsPerCourse +
    completedCourseIds.reduce((sum, id) => {
      const course = publishedCourses.find((c) => c.id === id);
      return sum + (course?.points ?? 0);
    }, 0);

  return {
    startedCourseIds,
    completedCourseIds,
    overallProgress,
    totalPoints,
  };
}

/** Encontra o nível de maturidade correspondente à pontuação acumulada. */
export function maturityForPoints(
  points: number,
  levels: MaturityLevel[],
): MaturityLevel | undefined {
  const sorted = [...levels].sort((a, b) => a.order - b.order);
  return (
    sorted.find(
      (level) =>
        points >= level.minPoints &&
        (level.maxPoints === null || points <= level.maxPoints),
    ) ?? sorted.at(-1)
  );
}

/** Certificados de um aluno, casados por e-mail. */
export function certificatesForStudent(
  member: CompanyMember,
  certificates: IssuedCertificate[],
): IssuedCertificate[] {
  return certificates.filter(
    (cert) => cert.studentEmail.toLowerCase() === member.email.toLowerCase(),
  );
}
