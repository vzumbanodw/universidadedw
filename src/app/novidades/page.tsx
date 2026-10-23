import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, Radio } from "lucide-react";
import { NovidadesBrowser } from "@/components/public/NovidadesBrowser";
import { readContent } from "@/lib/content/store.server";
import type { ReleaseNote } from "@/types/admin";

export const metadata: Metadata = {
  title: "Novidades & Atualizações · Dataweb",
  description:
    "Acompanhe em tempo real o que lançamos, melhoramos e corrigimos nos produtos Dataweb.",
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Hero notes={notes} />

      <main className="relative mx-auto w-full max-w-[1120px] px-5 pb-28 sm:px-8">
        {notes.length === 0 ? <EmptyState /> : <NovidadesBrowser notes={notes} />}
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
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-20 w-full max-w-[1120px] items-center justify-between px-5 sm:px-8">
        <Image
          src="/logo-dataweb.png"
          alt="Dataweb"
          width={132}
          height={36}
          priority
          className="h-7 w-auto brightness-0 invert"
        />
        <a
          href="https://www.dataweb.com.br"
          className="group inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-[13px] font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/30 hover:text-white"
        >
          dataweb.com.br
          <ArrowUpRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </a>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero — escuro, com malha técnica e a última versão em destaque               */
/* -------------------------------------------------------------------------- */

function Hero({ notes }: { notes: ReleaseNote[] }) {
  const latest = notes[0];
  const totalItems = notes.reduce((sum, n) => sum + n.entries.length, 0);
  const products = new Set(
    notes.flatMap((n) => n.entries.map((e) => e.produto.trim()).filter(Boolean)),
  );

  return (
    <section className="relative overflow-hidden bg-brand-dark pb-28 pt-32 sm:pb-36 sm:pt-40">
      {/* Malha de grade + auroras da marca */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.14) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(75% 65% at 50% 0%, #000 35%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(75% 65% at 50% 0%, #000 35%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(45% 55% at 12% 10%, rgba(0,160,177,0.38), transparent 70%), radial-gradient(40% 50% at 88% 0%, rgba(166,206,57,0.18), transparent 70%), radial-gradient(50% 60% at 60% 100%, rgba(251,176,64,0.12), transparent 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1120px] px-5 sm:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/40 bg-brand-primary/10 px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-brand-primary backdrop-blur-sm">
          <Radio className="h-3.5 w-3.5 animate-pulse motion-reduce:animate-none" aria-hidden />
          Release notes
        </span>

        <h1 className="mt-6 max-w-[16ch] text-balance text-[44px] font-semibold leading-[0.98] tracking-[-0.02em] text-white sm:text-[68px]">
          O que há de novo
          <span className="block bg-gradient-to-r from-brand-primary via-[#5FD4DE] to-brand-green bg-clip-text text-transparent">
            nos seus produtos
          </span>
        </h1>

        <p className="mt-6 max-w-[56ch] text-[16.5px] leading-relaxed text-white/60">
          Cada entrega, em um só lugar. Filtre pelo produto que você usa e veja
          em segundos o que mudou no seu dia a dia.
        </p>

        {/* Métricas do changelog */}
        {notes.length > 0 ? (
          <dl className="mt-12 grid max-w-[640px] grid-cols-3 gap-px overflow-hidden rounded-large border border-white/10 bg-white/10">
            <HeroStat label="Entregas" value={totalItems} />
            <HeroStat label="Produtos" value={products.size} />
            <HeroStat
              label="Última versão"
              value={latest ? `v${latest.version}` : "—"}
              accent
            />
          </dl>
        ) : null}
      </div>

      {/* Transição para o corpo claro */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background"
      />
    </section>
  );
}

function HeroStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="bg-brand-dark/80 px-5 py-4 backdrop-blur-sm">
      <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
        {label}
      </dt>
      <dd
        className={[
          "mt-1.5 text-[26px] font-semibold tabular-nums leading-none tracking-tight sm:text-[30px]",
          accent ? "text-brand-primary" : "text-white",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Estado vazio                                                                 */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <div className="-mt-12 flex flex-col items-center gap-3 rounded-large border border-dashed border-border-default bg-background-elevated px-6 py-20 text-center">
      <h2 className="text-[18px] font-semibold text-foreground-heading">
        Nenhuma atualização publicada ainda
      </h2>
      <p className="max-w-[46ch] text-[14px] leading-relaxed text-foreground-muted">
        Assim que publicarmos a próxima entrega dos produtos Dataweb, ela
        aparece aqui.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                      */
/* -------------------------------------------------------------------------- */

function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle bg-background-elevated">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
        <Image
          src="/logo-dataweb.png"
          alt="Dataweb"
          width={110}
          height={30}
          className="h-6 w-auto opacity-70"
        />
        <p className="text-[12.5px] text-foreground-muted">
          © {new Date().getFullYear()} Dataweb. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
