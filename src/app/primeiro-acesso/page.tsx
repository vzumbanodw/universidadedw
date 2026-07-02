import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { FirstAccessForm } from "@/components/auth/FirstAccessForm";
import { getCurrentStudent } from "@/lib/auth/student";

export const metadata: Metadata = {
  title: "Primeiro acesso · Universidade",
  description: "Defina a sua senha de acesso à Universidade Dataweb.",
};

export const dynamic = "force-dynamic";

/**
 * Tela pública de PRIMEIRO ACESSO. Também é usada após a aprovação de uma
 * redefinição de senha ("Esqueci minha senha") — o aluno informa o e-mail e
 * define a nova senha, sem perder nenhum progresso.
 */
export default async function PrimeiroAcessoPage() {
  const student = await getCurrentStudent();
  if (student) redirect("/dashboard");

  return (
    <main className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-14">
        <div className="w-full max-w-[440px]">
          <AuthCard>
            <div className="mb-7 flex flex-col items-start gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-regular bg-gradient-to-br from-brand-primary to-brand-secondary shadow-elevation-sm">
                <GraduationCap className="h-5 w-5 text-white" aria-hidden />
              </span>
              <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-foreground-heading">
                Primeiro acesso
              </h1>
              <p className="text-[14px] leading-relaxed text-foreground-subtitle">
                Digite o e-mail cadastrado pela sua empresa e crie a sua senha.
                Se a sua redefinição de senha foi aprovada, defina a nova senha
                aqui — seu progresso continua salvo.
              </p>
            </div>

            <FirstAccessForm />

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
