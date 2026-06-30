import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/ssr-server";
import {
  DEV_SESSION_COOKIE,
  getDevCredentials,
  isDevLoginEnabled,
} from "@/lib/auth/dev-session";

/**
 * Login do ALUNO (Supabase Auth, e-mail + senha). Não há cadastro: as contas
 * são criadas pelo operador no backoffice. Em caso de sucesso, o cliente SSR
 * grava os cookies de sessão automaticamente.
 *
 * Em desenvolvimento, sem Supabase configurado, cai num atalho de credencial
 * fixa para o app ser testável no localhost (ver `dev-session.ts`).
 */
export async function POST(request: Request) {
  const { email, password } = (await request.json()) as {
    email?: string;
    password?: string;
  };

  // --- Atalho de desenvolvimento (sem Supabase) -----------------------------
  if (!isSupabaseConfigured()) {
    if (!isDevLoginEnabled()) {
      return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
    }

    const dev = getDevCredentials();
    const ok =
      Boolean(email) &&
      Boolean(password) &&
      email!.trim().toLowerCase() === dev.email &&
      password === dev.password;

    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "invalid_credentials" },
        { status: 401 },
      );
    }

    (await cookies()).set(DEV_SESSION_COOKIE, dev.email, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return NextResponse.json({ ok: true });
  }

  // --- Fluxo real (Supabase Auth) -------------------------------------------
  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "invalid_credentials" },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "invalid_credentials" },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true });
}
