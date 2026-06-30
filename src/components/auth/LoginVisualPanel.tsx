import { Award, BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Visual / institutional panel shown on the left side of the login screen.
 *
 * The center area contains a placeholder `<div data-video-slot>` that should be
 * replaced by the marketing video. Drop a <video> element inside it — the
 * surrounding layout, gradient and floating cards stay untouched.
 */
export function LoginVisualPanel() {
  return (
    <aside
      aria-label="Apresentação da Universidade"
      className={cn(
        "relative isolate hidden lg:flex flex-col justify-between",
        "h-full w-full overflow-hidden",
        "bg-[var(--brand-blue-dark)] text-white",
      )}
    >
      {/* Gradient + grid background */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-[#0d1b29] via-[#12263A] to-[#0a2433]"
      />
      <div aria-hidden className="absolute inset-0 bg-grid-pattern opacity-60" />
      <div aria-hidden className="absolute inset-0 bg-radial-glow" />

      {/* Header — brand */}
      <header className="relative z-10 flex items-center justify-between px-10 pt-9">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight">Universidade</p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
              Dataweb
            </p>
          </div>
        </div>
        <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur">
          <Sparkles className="h-3 w-3 text-brand-orange" aria-hidden />
          Plataforma corporativa
        </span>
      </header>

      {/* Center — video slot */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-10 py-10">
        <div className="relative w-full max-w-[560px]">
          {/* Floating institutional cards (decorative) */}
          <FloatingCards />

          {/* Video institucional */}
          <div
            data-video-slot
            className={cn(
              "relative aspect-video w-full overflow-hidden rounded-medium",
              "bg-gradient-to-br from-white/[0.06] to-white/[0.02]",
              "border border-white/10 backdrop-blur-sm",
              "shadow-elevation-xl",
            )}
          >
            <video
              src="/videos/login-video.mov"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Subtle inner gradient overlay for legibility & depth */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10"
            />
          </div>
        </div>
      </div>

      {/* Footer — headline + subhead */}
      <footer className="relative z-10 px-10 pb-10">
        <div className="max-w-[520px]">
          <h1 className="text-balance text-[28px] font-semibold leading-[1.15] tracking-tight xl:text-[32px]">
            Aplicações, cursos e certificados.
          </h1>
          <p className="mt-3 text-balance text-[15px] leading-relaxed text-white/65">
            Escolha um caminho, avance nos cursos e comprove sua evolução com
            certificados.
          </p>
        </div>

        <div className="mt-6 flex items-center gap-5 text-[12px] text-white/55">
          <FooterStat label="Aplicações ativas" value="24" />
          <span aria-hidden className="h-3 w-px bg-white/10" />
          <FooterStat label="Cursos" value="10" />
          <span aria-hidden className="h-3 w-px bg-white/10" />
          <FooterStat label="Certificados" value="3" />
        </div>
      </footer>
    </aside>
  );
}

function BrandMark() {
  return (
    <span
      aria-hidden
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-regular bg-gradient-to-br from-brand-primary to-brand-secondary shadow-elevation-md"
    >
      <GraduationCap className="h-5 w-5 text-white" />
    </span>
  );
}

function FloatingCards() {
  return (
    <>
      {/* Top-right: courses badge */}
      <div
        className={cn(
          "pointer-events-none absolute -top-6 -right-8 z-10 hidden xl:flex",
          "min-w-[180px] items-center gap-3 rounded-regular border border-white/10",
          "bg-white/[0.06] px-4 py-3 backdrop-blur-md shadow-elevation-md",
          "animate-float",
        )}
        style={{ animationDelay: "0s" }}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-small bg-brand-orange/15 text-brand-orange">
          <BookOpen className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/50">
            Cursos
          </p>
          <p className="text-sm font-semibold text-white">Em andamento</p>
        </div>
      </div>

      {/* Bottom-left: progress card */}
      <div
        className={cn(
          "pointer-events-none absolute -bottom-8 -left-10 z-10 hidden xl:block",
          "w-[210px] rounded-regular border border-white/10",
          "bg-white/[0.06] p-4 backdrop-blur-md shadow-elevation-md",
          "animate-float",
        )}
        style={{ animationDelay: "1.2s" }}
      >
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-white/50">
          <span>Curso em andamento</span>
          <span className="text-white/70">82%</span>
        </div>
        <p className="mt-1.5 text-sm font-semibold text-white">CRM essencial</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-green"
            style={{ width: "82%" }}
          />
        </div>
      </div>

      {/* Mid-right: certification pill */}
      <div
        className={cn(
          "pointer-events-none absolute top-1/2 -right-12 z-10 hidden 2xl:flex",
          "-translate-y-1/2 items-center gap-2 rounded-full border border-white/10",
          "bg-white/[0.06] px-3.5 py-2 backdrop-blur-md shadow-elevation-md",
          "animate-float",
        )}
        style={{ animationDelay: "2.4s" }}
      >
        <Award className="h-3.5 w-3.5 text-brand-green" aria-hidden />
        <span className="text-[12px] font-medium text-white">
          Certificação disponível
        </span>
      </div>
    </>
  );
}

function FooterStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[15px] font-semibold text-white">{value}</span>
      <span>{label}</span>
    </div>
  );
}
