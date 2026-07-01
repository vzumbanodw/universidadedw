import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginVisualPanel } from "@/components/auth/LoginVisualPanel";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { GraduationCap } from "lucide-react";
import { getCurrentStudent } from "@/lib/auth/student";

export const metadata: Metadata = {
  title: "Entrar na Universidade",
  description:
    "Acesse aplicações, cursos e certificados da Universidade Dataweb.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Já autenticado? Vai direto para o dashboard.
  const student = await getCurrentStudent();
  if (student) redirect("/dashboard");

  return (
    <main className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[1.05fr_1fr] xl:grid-cols-[1.15fr_1fr]">
      <LoginVisualPanel />

      <section
        aria-label="Formulário de acesso"
        className="relative flex min-h-screen flex-col bg-background"
      >
        {/* Mobile-only top brand */}
        <header className="flex items-center justify-between px-6 pt-6 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-regular bg-gradient-to-br from-brand-primary to-brand-secondary shadow-elevation-sm">
              <GraduationCap className="h-4 w-4 text-white" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Universidade
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-foreground-disabled">
                Dataweb
              </p>
            </div>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-14">
          <AuthCard>
            <div className="mb-7 flex flex-col items-start gap-2">
              <span className="hidden lg:inline-flex h-10 w-10 items-center justify-center rounded-regular bg-gradient-to-br from-brand-primary to-brand-secondary shadow-elevation-sm">
                <GraduationCap className="h-5 w-5 text-white" aria-hidden />
              </span>
              <h2 className="text-[26px] font-semibold leading-tight tracking-tight text-foreground-heading">
                Entrar na Universidade Dataweb
              </h2>
              <p className="text-[15px] leading-relaxed text-foreground-subtitle">
                Acesse aplicações, cursos e certificados.
              </p>
            </div>

            <LoginForm />
          </AuthCard>
        </div>

        <footer className="px-6 pb-6 text-center text-[12px] text-foreground-disabled">
          © {new Date().getFullYear()} Dataweb · Universidade
        </footer>
      </section>
    </main>
  );
}
