import { readContent, writeContent } from "@/lib/content/store.server";
import type { LearningTrail } from "@/types/admin";

/**
 * Service de trilhas. Veja a nota de arquitetura em `./courses.ts`.
 *
 * Equivalente Supabase: tabela `learning_trails` + junção
 * `learning_trail_courses` (ordenada por `sort_order`) para os cursos. RLS:
 * leitura de trilhas publicadas; escrita restrita a operadores.
 */

export async function getTrails(): Promise<LearningTrail[]> {
  const { trails } = await readContent();
  return trails;
}

export async function getTrailById(id: string): Promise<LearningTrail | null> {
  const { trails } = await readContent();
  return trails.find((trail) => trail.id === id) ?? null;
}

export async function createTrail(trail: LearningTrail): Promise<LearningTrail> {
  const state = await readContent();
  await writeContent({ ...state, trails: [...state.trails, trail] });
  return trail;
}

export async function updateTrail(trail: LearningTrail): Promise<LearningTrail> {
  const state = await readContent();
  await writeContent({
    ...state,
    trails: state.trails.map((t) => (t.id === trail.id ? trail : t)),
  });
  return trail;
}

export async function deleteTrail(id: string): Promise<void> {
  const state = await readContent();
  await writeContent({
    ...state,
    trails: state.trails.filter((trail) => trail.id !== id),
  });
}
