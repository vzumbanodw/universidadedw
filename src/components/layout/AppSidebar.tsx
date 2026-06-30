"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  BookOpen,
  ShieldCheck,
  LogOut,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { useCurrentUser } from "@/components/auth/CurrentUserProvider";
import { logout } from "@/lib/auth/client";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

const PRIMARY_NAV: NavItem[] = [
  { label: "Aplicações", href: "/dashboard/aplicacoes", icon: Compass },
  { label: "Cursos", href: "/dashboard/cursos", icon: BookOpen },
  { label: "Certificados", href: "/dashboard/certificados", icon: ShieldCheck },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();

  async function handleLogout() {
    onNavigate?.();
    await logout();
    router.replace("/login");
    router.refresh();
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="flex h-full w-full flex-col bg-brand-dark text-white"
    >
      {/* Brand */}
      <Link
        href="/dashboard"
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
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
            Dataweb
          </p>
        </div>
      </Link>

      {/* Primary */}
      <div className="px-3">
        <SectionLabel>Aprendizado</SectionLabel>
        <ul className="flex flex-col gap-0.5">
          {PRIMARY_NAV.map((item) => (
            <li key={item.href}>
              <NavLink item={item} active={isActive(pathname, item.href)} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1" />

      {/* User card */}
      <div className="mx-3 mb-4 flex items-center gap-2.5 rounded-regular border border-white/10 bg-white/[0.04] px-3 py-2.5">
        <Avatar name={user.name} size="sm" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[12.5px] font-semibold text-white">
            {user.firstName}
          </p>
          <p className="truncate text-[11px] text-white/55">{user.role}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sair"
          className="rounded-small p-1.5 text-white/55 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          <LogOut className="h-4 w-4" />
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
      {item.badge ? (
        <span
          aria-label={`${item.badge} novas`}
          className="rounded-full bg-brand-orange/20 px-1.5 text-[10px] font-semibold text-brand-orange"
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname.startsWith(href);
}
