// Cliente Supabase ligado aos cookies da requisição (Supabase Auth).
//
// Usado em Route Handlers, Server Actions e Server Components para ler/gravar a
// sessão do ALUNO. Em Server Components o `setAll` é ignorado (não é possível
// gravar cookies de um RSC) — o refresh da sessão acontece no middleware.
//
// Server-side apenas: importa `next/headers`. Nunca importe de um client.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function requireEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}.`);
  return value;
}

export async function createSupabaseServerClient(): Promise<
  SupabaseClient<Database>
> {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    requireEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Chamado de um Server Component: ignore (middleware faz o refresh).
          }
        },
      },
    },
  );
}
