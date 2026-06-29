"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Route,
  Building2,
  GraduationCap as GraduationCapIcon,
  Award,
  BarChart3,
  Settings,
  Megaphone,
  ArrowLeft,
  GraduationCap,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    label: "Geral",
    items: [{ label: "Visão geral", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Conteúdo",
    items: [
      { label: "Aplicações & Módulos", href: "/admin/categorias", icon: Layers },
      { label: "Cursos & Aulas", href: "/admin/cursos", icon: BookOpen },
      { label: "Trilhas", href: "/admin/trilhas", icon: Route },
      { label: "Novidades & Updates", href: "/admin/updates", icon: Megaphone },
    ],
  },
  {
    label: "Pessoas",
    items: [
      { label: "Empresas & Acessos", href: "/admin/empresas", icon: Building2 },
      { label: "Alunos & Progresso", href: "/admin/alunos", icon: GraduationCapIcon },
      { label: "Certificados", href: "/admin/certificados", icon: Award },
    ],
  },
  {
    label: "Análise",
    items: [
      { label: "Relatórios", href: "/admin/relatorios", icon: BarChart3 },
      { label: "Configurações", href: "/admin/configuracoes", icon: Settings },
    ],
  },
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <nav
      aria-label="Navegação do backoffice"
      className="flex h-full w-full flex-col bg-brand-dark text-white"
    >
      <Link
        href="/admin"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-5 py-5"
      >
        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-regular bg-gradient-to-br from-brand-primary to-brand-secondary shadow-elevation-md"
        >
          <GraduationCap className="h-5 w-5 text-white" />
        </span>
        <div className="leading-tight">
          <p className="text-[14px] font-semibold tracking-tight text-white">
            Universidade
          </p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-brand-orange">
            Backoffice
          </p>
        </div>
      </Link>

      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <SectionLabel>{section.label}</SectionLabel>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    active={isActive(pathname, item.href)}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-3 mb-4 flex flex-col gap-1.5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-regular border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[12.5px] text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">Ver o app do aluno</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 rounded-regular px-3 py-2.5 text-[12.5px] text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-left">Sair do backoffice</span>
        </button>
      </div>
    </nav>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2.5 pb-1.5 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/40">
      {children}
    </p>
  );
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-regular px-2.5 py-2 text-[13.5px] transition-colors",
        active
          ? "bg-white/[0.10] font-medium text-white"
          : "text-white/70 hover:bg-white/[0.05] hover:text-white",
      )}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-primary"
        />
      ) : null}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-white" : "text-white/55 group-hover:text-white/90",
        )}
        aria-hidden
      />
      <span className="flex-1 truncate">{item.label}</span>
    </Link>
  );
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}
