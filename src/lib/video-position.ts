/**
 * Memória de POSIÇÃO do vídeo (retomar de onde parou), por aluno, no navegador.
 *
 * É apenas uma conveniência de reprodução: guarda no localStorage o ponto mais
 * avançado assistido de cada aula, para o player retomar dali. NÃO substitui nem
 * toca no progresso oficial por aluno (conclusão de aulas via
 * `/api/progress/complete` no Supabase) — isso continua no servidor.
 *
 * Namespaced por `studentId` para não misturar alunos no mesmo dispositivo.
 */

const PREFIX = "dw:videopos:v1:";

function key(studentId: string | undefined, courseId: string, lessonId: string): string {
  return `${PREFIX}${studentId || "guest"}:${courseId}:${lessonId}`;
}

/** Posição salva (segundos) para retomar. 0 se não houver. */
export function getVideoPosition(
  studentId: string | undefined,
  courseId: string,
  lessonId: string,
): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(key(studentId, courseId, lessonId));
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

/** Salva a posição, mantendo sempre o ponto mais avançado já assistido. */
export function saveVideoPosition(
  studentId: string | undefined,
  courseId: string,
  lessonId: string,
  seconds: number,
): void {
  if (typeof window === "undefined" || !Number.isFinite(seconds) || seconds <= 0) return;
  try {
    const previous = getVideoPosition(studentId, courseId, lessonId);
    if (seconds > previous) {
      window.localStorage.setItem(
        key(studentId, courseId, lessonId),
        String(Math.floor(seconds)),
      );
    }
  } catch {
    // storage indisponível — ignora
  }
}

/** Remove a posição salva (ex.: ao concluir a aula, para recomeçar do zero). */
export function clearVideoPosition(
  studentId: string | undefined,
  courseId: string,
  lessonId: string,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(studentId, courseId, lessonId));
  } catch {
    // ignora
  }
}
