import { readContent, writeContent } from "@/lib/content/store.server";
import type { IssuedCertificate } from "@/types/admin";

/**
 * Service de certificados. Veja a nota de arquitetura em `./courses.ts`.
 *
 * Equivalente Supabase: tabela `certificates` (FK para `students` e
 * `courses`/`learning_trails`). A geração do PDF (`certificate_url`) acontecerá
 * em uma rotina server-side com a SERVICE ROLE. RLS: o aluno lê apenas os
 * próprios certificados; operadores leem todos.
 */

export async function getCertificates(): Promise<IssuedCertificate[]> {
  const { certificates } = await readContent();
  return certificates;
}

export async function getCertificatesByStudent(
  studentEmail: string,
): Promise<IssuedCertificate[]> {
  const { certificates } = await readContent();
  const email = studentEmail.toLowerCase();
  return certificates.filter((c) => c.studentEmail.toLowerCase() === email);
}

export async function getCertificatesByCourse(
  courseId: string,
): Promise<IssuedCertificate[]> {
  const { certificates } = await readContent();
  return certificates.filter((c) => c.courseId === courseId);
}

export async function upsertCertificate(
  certificate: IssuedCertificate,
): Promise<IssuedCertificate> {
  const state = await readContent();
  const exists = state.certificates.some((c) => c.id === certificate.id);
  await writeContent({
    ...state,
    certificates: exists
      ? state.certificates.map((c) =>
          c.id === certificate.id ? certificate : c,
        )
      : [...state.certificates, certificate],
  });
  return certificate;
}

export async function deleteCertificate(id: string): Promise<void> {
  const state = await readContent();
  await writeContent({
    ...state,
    certificates: state.certificates.filter((c) => c.id !== id),
  });
}
