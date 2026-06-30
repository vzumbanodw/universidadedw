import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSupabaseServiceClient,
  hasServiceRole,
} from "@/lib/supabase/server";
import { generatePassword } from "@/lib/auth/passwords";

/**
 * Gestão de contas de aluno pelo operador. Todas as operações exigem o cookie
 * de operador e usam a SERVICE ROLE (admin API do Supabase Auth), executada
 * somente no servidor.
 *
 * POST  → cria a conta (ou redefine a senha, se `userId` vier no corpo).
 *         Retorna { email, password, userId } para o operador entregar ao aluno.
 * DELETE → remove a conta (`?userId=`).
 */

async function isOperator(): Promise<boolean> {
  const session = (await cookies()).get("admin_session")?.value;
  return session === "ok";
}

function serviceUnavailable() {
  return NextResponse.json(
    {
      error:
        "Supabase SERVICE ROLE não configurada no servidor (SUPABASE_SERVICE_ROLE_KEY).",
    },
    { status: 503 },
  );
}

export async function POST(request: Request) {
  if (!(await isOperator())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasServiceRole()) return serviceUnavailable();

  const body = (await request.json()) as {
    email?: string;
    name?: string;
    memberId?: string;
    companyId?: string;
    userId?: string;
    password?: string;
  };

  const password = body.password?.trim() || generatePassword();
  const supabase = createSupabaseServiceClient();

  // Redefinição de senha de uma conta existente.
  if (body.userId) {
    const { error } = await supabase.auth.admin.updateUserById(body.userId, {
      password,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      action: "reset",
      email: body.email ?? null,
      password,
      userId: body.userId,
    });
  }

  // Criação de uma nova conta.
  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "E-mail obrigatório." }, { status: 400 });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: body.name ?? "",
      memberId: body.memberId ?? "",
      companyId: body.companyId ?? "",
    },
  });

  if (error) {
    const already = /registered|already|exists/i.test(error.message);
    return NextResponse.json(
      {
        error: already
          ? "Já existe uma conta com este e-mail."
          : error.message,
      },
      { status: already ? 409 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    action: "create",
    email,
    password,
    userId: data.user?.id ?? null,
  });
}

export async function DELETE(request: Request) {
  if (!(await isOperator())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasServiceRole()) return serviceUnavailable();

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId obrigatório." }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
