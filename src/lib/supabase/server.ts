// IMPORTANTE: este módulo é estritamente server-side. Quando o projeto adotar
// o pacote `server-only` (`npm i server-only`), adicione `import "server-only";`
// no topo para que qualquer import acidental em código client falhe no build.
// A SERVICE ROLE só é lida de `process.env.SUPABASE_SERVICE_ROLE_KEY` (sem o
// prefixo NEXT_PUBLIC_), então o Next nunca a injeta no bundle do browser.

/**
 * Clientes Supabase para o servidor (Route Handlers, Server Components,
 * Server Actions).
 *
 * - `createSupabaseServerAnonClient()` usa a anon key. As policies de RLS valem
 *   (leitura pública do conteúdo publicado). Use para leituras.
 *
 * - `createSupabaseServiceClient()` usa a SERVICE ROLE key, que IGNORA o RLS.
 *   Use apenas em rotinas administrativas confiáveis no servidor (gravar o
 *   documento de conteúdo, seed, emissão de certificado). NUNCA exponha essa
 *   key ao navegador.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type SupabaseServerClient = SupabaseClient<Database>;

function env() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/** Há URL + ao menos uma chave (anon ou service role)? */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey, serviceRoleKey } = env();
  return Boolean(url && (anonKey || serviceRoleKey));
}

/** Há URL + service role? (necessário para gravar/seed.) */
export function hasServiceRole(): boolean {
  const { url, serviceRoleKey } = env();
  return Boolean(url && serviceRoleKey);
}

function requireEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}.`);
  return value;
}

const NO_PERSIST = { auth: { persistSession: false, autoRefreshToken: false } };

/** Cliente com a anon key — respeita RLS. */
export function createSupabaseServerAnonClient(): SupabaseServerClient {
  const { url, anonKey } = env();
  return createClient<Database>(
    requireEnv(url, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    NO_PERSIST,
  );
}

/** Cliente administrativo com SERVICE ROLE — ignora RLS. Só no servidor. */
export function createSupabaseServiceClient(): SupabaseServerClient {
  const { url, serviceRoleKey } = env();
  return createClient<Database>(
    requireEnv(url, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY"),
    NO_PERSIST,
  );
}

/**
 * Melhor cliente disponível para leitura server-side: prefere a service role
 * (evita problemas de RLS durante o setup e permite o auto-seed), caindo para a
 * anon key quando a service role não estiver definida.
 */
export function createSupabaseReadClient(): SupabaseServerClient {
  return hasServiceRole()
    ? createSupabaseServiceClient()
    : createSupabaseServerAnonClient();
}

export type { Database };
