"use client";

/**
 * Cliente Supabase para o navegador (componentes client-side).
 *
 * Usa exclusivamente a chave pública (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), que é
 * segura para o front-end desde que as policies de RLS estejam ativas — toda a
 * autorização real acontece no banco, nunca no cliente.
 *
 * Hoje o backoffice e o app do aluno acessam o conteúdo via `/api/content`
 * (server-side), então este cliente fica disponível para usos futuros
 * client-side (ex.: realtime, Supabase Auth). Ele é um singleton lazy.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type SupabaseBrowserClient = SupabaseClient<Database>;

export function getBrowserSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, anonKey, configured: Boolean(url && anonKey) };
}

let browserClient: SupabaseBrowserClient | null = null;

export function createSupabaseBrowserClient(): SupabaseBrowserClient {
  if (browserClient) return browserClient;

  const { url, anonKey, configured } = getBrowserSupabaseConfig();
  if (!configured) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local.",
    );
  }

  browserClient = createClient<Database>(url!, anonKey!, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return browserClient;
}

export type { Database };
