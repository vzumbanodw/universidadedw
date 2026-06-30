import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { NovidadesBrowser } from "@/components/public/NovidadesBrowser";
import { readContent } from "@/lib/content/store.server";
import { monthLabel } from "@/lib/admin/options";
import type { ReleaseNote } from "@/types/admin";

export const metadata: Metadata = {
  title: "Novidades & Atualizações · Dataweb",
  description:
    "Acompanhe as novidades, melhorias e correções dos produtos Dataweb.",
};

export const dynamic = "force-dynamic";

export default async function NovidadesPage() {
  const content = await readContent();
  const notes = [...content.releaseNotes]
    .filter((n) => n.published)
    .sort(
      (a, b) =>
        b.year - a.year || b.month - a.month || b.date.localeCompare(a.date),
    );
  const latest = notes[0];

  return (
    <div className="min-h-screen bg-background-subtle text-foreground">
      <SiteHeader />

      <Hero count={notes.length} latest={latest} />

      <main className="mx-auto w-full max-w-[1080px] px-5 pb-24 sm:px-8">
        {notes.length === 0 ? (
          <EmptyState />
        ) : (
          <NovidadesBrowser notes={notes} />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Header                                                                      */
/* -------------------------------------------------------------------------- */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-background-elevated/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1080px] items-center justify-between px-5 sm:px-8">
        <Image
          src="/logo-dataweb.png"
          alt="Dataweb"
          width={132}
          height={36}
          priority
          className="h-7 w-auto"
        />
        <nav className="flex items-center gap-5 text-[13.5px] font-medium text-foreground-muted">
          <span className="hidden items-center gap-1.5 text-foreground-subtitle sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5 text-brand-orange" aria-hidden />
            Novidades
          </span>
          <a
            href="https://www.dataweb.com.br"
            className="inline-flex items-center gap-1 rounded-full border border-border-default px-3.5 py-1.5 text-foreground-subtitle transition-colors hover:border-brand-primary hover:text-brand-primary"
          >
            Site Dataweb
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>
        </nav>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */

function Hero({ count, latest }: { count: number; latest?: ReleaseNote }) {
  return (
    <section className="relative overflow-hidden border-b border-border-subtle bg-background-elevated">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(60% 70% at 15% 0%, rgba(0,160,177,0.10), transparent 60%), radial-gradient(50% 60% at 100% 20%, rgba(251,176,64,0.08), transparent 65%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-[1080px] px-5 py-16 sm:px-8 sm:py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-brand-primary/8 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" aria-hidden />
          Changelog Dataweb
        </span>
        <h1 className="mt-5 max-w-[18ch] text-balance text-[36px] font-semibold leading-[1.08] tracking-tight text-foreground-heading sm:text-[52px]">
          Novidades &amp; atualizações dos produtos
        </h1>
        <p className="mt-4 max-w-[58ch] text-[16px] leading-relaxed text-foreground-subtitle">
          Reunimos aqui as melhorias, correções e novas funcionalidades das
          nossas soluções, organizadas por versão.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3 text-[13px] text-foreground-muted">
          <span className="inline-flex items-center gap-2 rounded-regular border border-border-subtle bg-background-subtle px-3.5 py-2">
            <strong className="text-[15px] font-semibold tabular-nums text-foreground-heading">
              {count}
            </strong>
            {count === 1 ? "publicação" : "publicações"}
          </span>
          {latest ? (
            <span className="inline-flex items-center gap-2 rounded-regular border border-border-subtle bg-background-subtle px-3.5 py-2">
              Última versão
              <Badge variant="primary" size="sm">
                v{latest.version}
              </Badge>
              <span className="text-foreground-subtitle">
                · {monthLabel(latest.month)} de {latest.year}
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty + Footer                                                              */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <div className="mt-12 flex flex-col items-center justify-center gap-3 rounded-large border border-dashed border-border-default bg-background-elevated px-6 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-medium bg-brand-primary/10 text-brand-primary">
        <Sparkles className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="text-[17px] font-semibold tracking-tight text-foreground-heading">
        Em breve, novidades por aqui
      </h2>
      <p className="max-w-[44ch] text-[14px] leading-relaxed text-foreground-muted">
        Ainda não há atualizações publicadas. Volte em breve para acompanhar a
        evolução dos produtos Dataweb.
      </p>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle bg-background-elevated">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row sm:px-8">
        <Image
          src="/logo-dataweb.png"
          alt="Dataweb"
          width={120}
          height={32}
          className="h-6 w-auto opacity-80"
        />
        <p className="text-[12.5px] text-foreground-muted">
          © {new Date().getFullYear()} Dataweb. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
