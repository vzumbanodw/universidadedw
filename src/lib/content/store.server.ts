import { promises as fs } from "fs";
import path from "path";
import { createSeedState, type AdminState } from "@/lib/admin/seed";
import {
  createSupabaseReadClient,
  createSupabaseServiceClient,
  hasServiceRole,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import type { AccessRequest } from "@/types/admin";
import {
  insertAccessRequestToSupabase,
  readStateFromSupabase,
  updateAccessRequestInSupabase,
  writeStateToSupabase,
  TablesMissing,
} from "./store.supabase";

/**
 * Fonte de verdade do conteúdo, no servidor. Backends, em ordem de preferência:
 *
 * 1. SUPABASE NORMALIZADO — tabelas relacionais (courses, lessons, members…).
 *    É o destino final. Ver `store.supabase.ts`.
 * 2. SUPABASE DOCUMENTO — tabela `app_content` (JSONB). Usado como fallback
 *    enquanto as tabelas normalizadas ainda não foram criadas (migration
 *    `0002_normalized_schema.sql` não rodada). Mantém o app no ar na transição.
 * 3. ARQUIVO LOCAL — `.data/content.json`, quando o Supabase não está
 *    configurado (protótipo em desenvolvimento).
 *
 * `normalize()` garante que todas as coleções existam em qualquer caso.
 */

const CONTENT_ROW_ID = 1;
const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "content.json");

let fileCache: AdminState | null = null;

function normalize(state: Partial<AdminState>): AdminState {
  const seed = createSeedState();
  return {
    categories: state.categories ?? seed.categories,
    courses: state.courses ?? seed.courses,
    lessons: state.lessons ?? seed.lessons,
    companies: state.companies ?? seed.companies,
    members: state.members ?? seed.members,
    accessRequests: state.accessRequests ?? seed.accessRequests,
    maturityLevels: state.maturityLevels ?? seed.maturityLevels,
    certificates: state.certificates ?? seed.certificates,
    releaseNotes: state.releaseNotes ?? seed.releaseNotes,
    settings: state.settings ?? seed.settings,
  };
}

/* -------------------------------------------------------------------------- */
/* API pública                                                                 */
/* -------------------------------------------------------------------------- */

export async function readContent(): Promise<AdminState> {
  if (!isSupabaseConfigured()) return readFromFile();

  try {
    const state = await readStateFromSupabase();
    if (state) return state;

    // Tabelas existem mas estão vazias → migra o documento atual para elas.
    const initial = await migrationSource();
    if (hasServiceRole()) {
      try {
        await writeStateToSupabase(initial);
      } catch (error) {
        if (!(error instanceof TablesMissing)) throw error;
      }
    }
    return initial;
  } catch (error) {
    if (error instanceof TablesMissing) {
      // Tabelas normalizadas ainda não criadas: usa o documento JSONB.
      return readFromContentDoc();
    }
    console.error("[content] falha lendo do Supabase:", (error as Error).message);
    return createSeedState();
  }
}

export async function writeContent(next: AdminState): Promise<AdminState> {
  if (!isSupabaseConfigured()) return writeToFile(next);

  try {
    await writeStateToSupabase(next);
    return next;
  } catch (error) {
    if (error instanceof TablesMissing) {
      // Pré-migração: grava no documento JSONB para não perder a alteração.
      return writeToContentDoc(next);
    }
    throw error;
  }
}

/** De onde puxar o estado inicial ao seedar as tabelas normalizadas. */
async function migrationSource(): Promise<AdminState> {
  const doc = await readContentDocRaw();
  if (doc) return doc;
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return normalize(JSON.parse(raw) as Partial<AdminState>);
  } catch {
    return createSeedState();
  }
}

/* -------------------------------------------------------------------------- */
/* Backend: Supabase — documento JSONB (app_content)                           */
/* -------------------------------------------------------------------------- */

/** Lê a linha de `app_content` sem seedar. Retorna null se vazia/ausente. */
async function readContentDocRaw(): Promise<AdminState | null> {
  try {
    const client = createSupabaseReadClient();
    const { data, error } = await client
      .from("app_content")
      .select("data")
      .eq("id", CONTENT_ROW_ID)
      .maybeSingle();
    if (error || !data?.data) return null;
    return normalize(data.data as Partial<AdminState>);
  } catch {
    return null;
  }
}

/** Leitura do documento JSONB com auto-seed (fallback pré-migração). */
async function readFromContentDoc(): Promise<AdminState> {
  const doc = await readContentDocRaw();
  if (doc) return doc;
  const seed = createSeedState();
  if (hasServiceRole()) await persistToContentDoc(seed);
  return seed;
}

async function writeToContentDoc(next: AdminState): Promise<AdminState> {
  if (!hasServiceRole()) {
    throw new Error("Gravação requer SUPABASE_SERVICE_ROLE_KEY no servidor.");
  }
  await persistToContentDoc(next);
  return next;
}

async function persistToContentDoc(state: AdminState): Promise<void> {
  const client = createSupabaseServiceClient();
  const { error } = await client.from("app_content").upsert({
    id: CONTENT_ROW_ID,
    data: state as unknown as Json,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    throw new Error(`Falha ao gravar conteúdo no Supabase: ${error.message}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Backend: arquivo local (fallback de protótipo)                              */
/* -------------------------------------------------------------------------- */

async function readFromFile(): Promise<AdminState> {
  if (fileCache) return fileCache;
  try {
    const raw = await fs.readFile(FILE, "utf8");
    fileCache = normalize(JSON.parse(raw) as Partial<AdminState>);
  } catch {
    fileCache = createSeedState();
    await persistToFile(fileCache);
  }
  return fileCache;
}

async function writeToFile(next: AdminState): Promise<AdminState> {
  fileCache = next;
  await persistToFile(next);
  return next;
}

async function persistToFile(state: AdminState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(state, null, 2), "utf8");
}

/* -------------------------------------------------------------------------- */
/* Solicitações de acesso — escrita pontual (fora do "replace" completo)       */
/* -------------------------------------------------------------------------- */

function newRequestId(): string {
  return `acr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Cria uma solicitação de acesso (fluxo público do login). */
export async function createAccessRequest(input: {
  name: string;
  email: string;
  companyName?: string;
}): Promise<AccessRequest> {
  const req: AccessRequest = {
    id: newRequestId(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    companyName: input.companyName?.trim() || undefined,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && hasServiceRole()) {
    try {
      await insertAccessRequestToSupabase(req);
      return req;
    } catch (error) {
      if (!(error instanceof TablesMissing)) throw error;
      // Supabase ativo, mas a tabela ainda não existe: avisa em vez de perder
      // o pedido (o replace do conteúdo não grava `access_requests`).
      throw new Error(
        "A tabela de solicitações ainda não existe no Supabase. Rode a migration 0003 e tente novamente.",
      );
    }
  }

  // Sem Supabase (dev local): persiste no documento inteiro (arquivo).
  const content = await readContent();
  await writeContent({
    ...content,
    accessRequests: [...content.accessRequests, req],
  });
  return req;
}

/** Aprova/recusa uma solicitação (operador). Retorna a solicitação atualizada. */
export async function reviewAccessRequest(
  id: string,
  status: "approved" | "rejected",
  companyId?: string,
): Promise<AccessRequest | null> {
  const reviewedAt = new Date().toISOString();

  if (isSupabaseConfigured() && hasServiceRole()) {
    try {
      return await updateAccessRequestInSupabase(id, { status, companyId, reviewedAt });
    } catch (error) {
      if (!(error instanceof TablesMissing)) throw error;
    }
  }

  const content = await readContent();
  let updated: AccessRequest | null = null;
  const next = content.accessRequests.map((r) => {
    if (r.id !== id) return r;
    updated = { ...r, status, companyId: companyId ?? r.companyId, reviewedAt };
    return updated;
  });
  await writeContent({ ...content, accessRequests: next });
  return updated;
}
