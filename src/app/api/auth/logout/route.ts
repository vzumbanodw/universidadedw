import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/ssr-server";
import { DEV_SESSION_COOKIE } from "@/lib/auth/dev-session";

/** Logout do aluno: encerra a sessão e limpa os cookies do Supabase. */
export async function POST() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } else {
    (await cookies()).delete(DEV_SESSION_COOKIE);
  }
  return NextResponse.json({ ok: true });
}
