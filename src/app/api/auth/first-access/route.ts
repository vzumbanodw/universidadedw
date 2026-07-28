import { NextResponse } from "next/server";
import { activateStudentAccount } from "@/lib/auth/account.server";
import { resolveActivationToken } from "@/lib/auth/activation-tokens.server";
import { createSupabaseServerClient } from "@/lib/supabase/ssr-server";

/**
 * Criação de senha pelo LINK PESSOAL do e-mail de aprovação (endpoint PÚBLICO
 * da página /primeiro-acesso): o token identifica o e-mail do solicitante —
 * ninguém digita e-mail, e um token inválido não cria nada. Em caso de
 * sucesso, já autentica (cookies de sessão) e o app redireciona ao dashboard.
 */

const MIN_PASSWORD = 8;

const STATUS_BY_CODE = {
  unavailable: 503,
  not_found: 404,
  suspended: 403,
  already_active: 409,
  error: 400,
} as const;

export async function POST(request: Request) {
  let body: { token?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const password = body.password ?? "";

  if (password.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.` },
      { status: 400 },
    );
  }

  const resolved = await resolveActivationToken(token);
  if (!resolved) {
    return NextResponse.json(
      {
        error:
          "Link inválido ou expirado. Abra o link mais recente que você recebeu por e-mail ou solicite acesso novamente.",
      },
      { status: 404 },
    );
  }

  const result = await activateStudentAccount(resolved.email, password);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, code: result.code },
      { status: STATUS_BY_CODE[result.code] },
    );
  }

  // Autentica na sequência para o aluno já cair no dashboard.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: resolved.email,
    password,
  });
  if (error) {
    // Conta criada/senha redefinida; o login manual ainda funciona.
    return NextResponse.json({ ok: true, mode: result.mode, signedIn: false });
  }

  return NextResponse.json({ ok: true, mode: result.mode, signedIn: true });
}
