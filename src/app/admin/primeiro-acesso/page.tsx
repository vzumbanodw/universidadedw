import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MailQuestion, ShieldCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { AdminFirstAccessForm } from "@/components/admin/AdminFirstAccessForm";
import { findAdminByActivationToken } from "@/lib/auth/admin-users.server";

export const metadata: Metadata = {
  title: "Criar senha · Backoffice Universidade",
  description: "Ative a sua conta de administrador do backoffice.",
};

export const dynamic = "force-dynamic";

/**
 * Ativação da conta de ADMINISTRADOR (pública, via link pessoal ?token=...):
 * a pessoa define a própria senha do backoffice e já entra logada.
 */
export default async function AdminPrimeiroAcessoPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let admin = null;
  try {
    admin = token ? await findAdminByActivationToken(token) : null;
  } catch {
    admin = null; // tabela ausente/serviço fora: cai na tela de link inválido
  }

  return (
    <main className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-14">
        <div className="w-full max-w-[440px]">
          <AuthCard>
            {admin ? (
              <>
                <div className="mb-7 flex flex-col items-start gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-regular bg-gradient-to-br from-brand-primary to-brand-secondary shadow-elevation-sm">
                    <ShieldCheck className="h-5 w-5 text-white" aria-hidden />
                  </span>
                  <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-foreground-heading">
                    Crie sua senha do backoffice
                  </h1>
                  <p className="text-[14px] leading-relaxed text-foreground-subtitle">
                    Olá, {admin.name}! Sua conta de administrador
                    ({admin.email}) está pronta — defina a senha para começar.
                  </p>
                </div>

                <AdminFirstAccessForm token={token!} email={admin.email} />
              </>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-regular bg-background-warning text-foreground-warning">
                  <MailQuestion className="h-5 w-5" aria-hidden />
                </span>
                <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-foreground-heading">
                  Link inválido ou já utilizado
                </h1>
                <p className="text-[14px] leading-relaxed text-foreground-subtitle">
                  A ativação da conta de administrador é feita pelo link pessoal
                  enviado a você. Se a sua conta já foi ativada, entre pelo
                  login; caso contrário, peça um novo link ao responsável.
                </p>
              </div>
            )}

            <p className="mt-6 text-center text-[13px] text-foreground-disabled">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1 font-medium text-foreground-brand underline-offset-4 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Ir para o login do backoffice
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
