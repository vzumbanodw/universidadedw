"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, ListChecks, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatMinutes } from "@/lib/formatters";

/** Dados mínimos do curso para o anúncio (vêm do cadastro no backoffice). */
export type AnnouncedCourse = {
  id: string;
  title: string;
  description: string;
  categoryName: string;
  href: string;
  coverImageUrl?: string;
  lessonsCount: number;
  estimatedMinutes: number;
};

const STORAGE_KEY = "udw:cursos-anunciados";

/**
 * Aviso de CURSO NOVO para o aluno — modal padrão exibido em qualquer tela da
 * área do aluno quando o backoffice publica um curso que ele ainda não viu.
 *
 * Como decide o que é "novo": na primeira visita, registra os cursos atuais
 * como já conhecidos (nada é exibido — evita uma enxurrada de avisos). A
 * partir daí, qualquer curso publicado que não esteja nessa lista dispara o
 * modal. O controle é por navegador (localStorage), sem depender de backend.
 */
export function NewCourseModal({ courses }: { courses: AnnouncedCourse[] }) {
  const [pending, setPending] = useState<AnnouncedCourse[]>([]);

  useEffect(() => {
    if (courses.length === 0) return;

    let seen: string[] = [];
    let firstVisit = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          seen = parsed.filter((id): id is string => typeof id === "string");
          firstVisit = false;
        }
      }
    } catch {
      /* storage indisponível: segue sem anunciar */
      return;
    }

    const unseen = courses.filter((course) => !seen.includes(course.id));

    // Primeira visita (ou storage limpo): só registra a base, sem anunciar.
    if (firstVisit) {
      persist(courses.map((c) => c.id));
      return;
    }
    if (unseen.length === 0) return;

    setPending(unseen);
    // Marca todos como vistos já na exibição: o aviso não volta se a pessoa
    // fechar a aba sem interagir.
    persist([...seen, ...unseen.map((c) => c.id)]);
  }, [courses]);

  function persist(ids: string[]) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* sem storage: o aviso pode repetir, mas nada quebra */
    }
  }

  if (pending.length === 0) return null;

  const [course, ...others] = pending;
  if (!course) return null;

  return (
    <Modal
      open
      onClose={() => setPending([])}
      size="md"
      title="Novo curso disponível"
      description="Acabou de entrar no ar na Universidade Dataweb."
      footer={
        <>
          <Button variant="ghost" onClick={() => setPending([])}>
            Agora não
          </Button>
          <Link href={course.href} onClick={() => setPending([])}>
            <Button rightIcon={<ArrowRight className="h-4 w-4" />}>Ver o curso</Button>
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Capa cadastrada no backoffice (ou um placeholder da marca) */}
        <div className="relative overflow-hidden rounded-medium border border-border-subtle bg-background-subtle">
          {course.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.coverImageUrl}
              alt=""
              className="h-[168px] w-full object-cover"
            />
          ) : (
            <div className="flex h-[168px] w-full items-center justify-center bg-gradient-to-br from-brand-primary/15 to-brand-secondary/15 text-foreground-muted">
              <BookOpen className="h-8 w-8" aria-hidden />
            </div>
          )}
          <span className="absolute left-3 top-3">
            <Badge variant="primary" size="sm" icon={<Sparkles className="h-3 w-3" />}>
              Novo
            </Badge>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-muted">
            {course.categoryName}
          </p>
          <h3 className="text-[19px] font-semibold leading-tight tracking-tight text-foreground-heading">
            {course.title}
          </h3>
          {course.description ? (
            <p className="text-[14px] leading-relaxed text-foreground-subtitle">
              {course.description}
            </p>
          ) : null}

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-foreground-muted">
            <span className="inline-flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" aria-hidden />
              {course.lessonsCount} aula{course.lessonsCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {formatMinutes(course.estimatedMinutes)}
            </span>
          </div>
        </div>

        {others.length > 0 ? (
          <p className="rounded-regular border border-border-subtle bg-background-subtle/50 px-3.5 py-2.5 text-[13px] text-foreground-muted">
            Também {others.length === 1 ? "chegou" : "chegaram"}{" "}
            <strong className="font-semibold text-foreground-heading">
              {others.length === 1 ? "mais 1 curso" : `mais ${others.length} cursos`}
            </strong>{" "}
            —{" "}
            <Link
              href="/dashboard/cursos"
              onClick={() => setPending([])}
              className="font-medium text-foreground-brand underline-offset-4 hover:underline"
            >
              ver todos
            </Link>
            .
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
