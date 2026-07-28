import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, GraduationCap, MailQuestion } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { FirstAccessForm } from "@/components/auth/FirstAccessForm";
import { getCurrentStudent } from "@/lib/auth/student";
import { resolveActivationToken } from "@/lib/auth/activation-tokens.server";

export const metadata: Metadata = {
  title: "Criar senha · Universidade",
  description: "Crie a sua senha de acesso à Universidade Dataweb.",
};

export const dynamic = "force-dynamic";

/**
 * Landing de CRIAÇÃO DE SENHA, acessada exclusivamente pelo link pessoal
 * enviado por e-mail após a aprovação (?token=...):
 *
 *   - solicitação de ACESSO aprovada → o solicitante cria a primeira senha;
 *   - REDEFINIÇÃO aprovada → o aluno define a nova senha (progresso salvo).
 *
 * Sem token válido, a página orienta a pessoa em vez de expor formulário.
 */
export default async function PrimeiroAcessoPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const student = await getCurrentStudent();
  if (student) redirect("/dashboard");

  const { token } = await searchParams;
  const resolved = token ? await resolveActivationToken(token) : null;
  const isReset = resolved?.kind === "reset";

  return (
    <main className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-14">
        <div className="w-full max-w-[440px]">
          <AuthCard>
            {resolved ? (
              <>
                <div className="mb-7 flex flex-col items-start gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-regular bg-gradient-to-br from-brand-primary to-brand-secondary shadow-elevation-sm">
                    <GraduationCap className="h-5 w-5 text-white" aria-hidden />
                  </span>
                  <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-foreground-heading">
                    {isReset ? "Defina sua nova senha" : "Crie sua senha de acesso"}
                  </h1>
                  <p className="text-[14px] leading-relaxed text-foreground-subtitle">
                    {isReset
                      ? "Sua redefinição foi aprovada. Defina a nova senha abaixo — todo o seu progresso continua salvo."
                      : `${resolved.kind === "access" ? `Olá, ${resolved.name}! ` : ""}Seu acesso foi aprovado. Crie a senha para entrar na Universidade Dataweb.`}
                  </p>
                </div>

                <FirstAccessForm token={token!} email={resolved.email} isReset={isReset} />
              </>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-regular bg-background-warning text-foreground-warning">
                  <MailQuestion className="h-5 w-5" aria-hidden />
                </span>
                <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-foreground-heading">
                  Link inválido ou expirado
                </h1>
                <p className="text-[14px] leading-relaxed text-foreground-subtitle">
                  A criação de senha é feita pelo link pessoal enviado por
                  e-mail quando a sua solicitação é aprovada. Confira se você
                  abriu o link mais recente ou solicite acesso novamente na
                  tela de login.
                </p>
              </div>
            )}

            <p className="mt-6 text-center text-[13px] text-foreground-disabled">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 font-medium text-foreground-brand underline-offset-4 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Voltar para o login
              </Link>
            </p>
          </AuthCard>
        </div>
      </div>

      <footer className="px-6 pb-6 text-center text-[12px] text-foreground-disabled">
        © {new Date().getFullYear()} Dataweb · Universidade
      </footer>
    </main>
  );
}
