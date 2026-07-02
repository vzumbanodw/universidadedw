import { NextResponse } from "next/server";
import { activateStudentAccount } from "@/lib/auth/account.server";
import { createSupabaseServerClient } from "@/lib/supabase/ssr-server";

/**
 * PRIMEIRO ACESSO / redefinição aprovada (endpoint PÚBLICO da tela
 * /primeiro-acesso): o aluno informa o e-mail cadastrado e define a senha.
 * Em caso de sucesso, já autentica (cookies de sessão) e o app redireciona
 * para o dashboard.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

const STATUS_BY_CODE = {
  unavailable: 503,
  not_found: 404,
  suspended: 403,
  already_active: 409,
  error: 400,
} as const;

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.` },
      { status: 400 },
    );
  }

  const result = await activateStudentAccount(email, password);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, code: result.code },
      { status: STATUS_BY_CODE[result.code] },
    );
  }

  // Autentica na sequência para o aluno já cair no dashboard.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Conta criada/senha redefinida; o login manual ainda funciona.
    return NextResponse.json({ ok: true, mode: result.mode, signedIn: false });
  }

  return NextResponse.json({ ok: true, mode: result.mode, signedIn: true });
}
