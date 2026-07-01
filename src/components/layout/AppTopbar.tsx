"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useCurrentUser } from "@/components/auth/CurrentUserProvider";
import { logout } from "@/lib/auth/client";
import { getGreeting } from "@/lib/formatters";

type AppTopbarProps = {
  onOpenMobileNav: () => void;
};

export function AppTopbar({ onOpenMobileNav }: AppTopbarProps) {
  const user = useCurrentUser();
  const [greeting, setGreeting] = useState("Olá");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 border-b border-border-subtle bg-background-elevated/85 backdrop-blur-xl"
    >
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Abrir menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-regular border border-border-subtle text-foreground-muted transition-colors hover:bg-background-subtle lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Greeting */}
        <div className="hidden min-w-0 flex-1 lg:block">
          <p className="truncate text-[13px] text-foreground-muted">
            {greeting}, {user.firstName}
          </p>
          <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground-heading">
            Aplicações, cursos e certificados em um só lugar
          </h1>
        </div>

        {/* Search */}
        <div className="ml-auto flex w-full max-w-[460px] items-center gap-2 lg:ml-3">
          <SearchInput />
        </div>

        {/* Avatar + menu */}
        <UserMenu name={user.name} email={user.email} role={user.role} />
      </div>
    </header>
  );
}

function UserMenu({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function onLogout() {
    setSigningOut(true);
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir menu do usuário"
        className="rounded-full transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Avatar name={name} size="md" ring />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-40 w-56 overflow-hidden rounded-medium border border-border-subtle bg-background-elevated p-1.5 shadow-elevation-lg"
        >
          <div className="px-3 py-2">
            <p className="truncate text-[13px] font-semibold text-foreground-heading">
              {name}
            </p>
            <p className="truncate text-[12px] text-foreground-muted">
              {email || role}
            </p>
          </div>
          <span aria-hidden className="my-1 block h-px bg-border-subtle" />
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            disabled={signingOut}
            className="flex w-full items-center gap-2 rounded-regular px-3 py-2 text-left text-[13px] font-medium text-foreground-subtitle transition-colors hover:bg-background-subtle hover:text-foreground disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {signingOut ? "Saindo…" : "Sair"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SearchInput() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/dashboard/busca?q=${encodeURIComponent(term)}` : "/dashboard/busca");
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="relative flex h-10 w-full items-center rounded-regular border border-border-subtle bg-background-subtle transition-colors focus-within:border-foreground-subtitle focus-within:bg-background-elevated"
    >
      <Search
        aria-hidden
        className="ml-3 h-4 w-4 shrink-0 text-foreground-muted"
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar aplicações ou cursos..."
        aria-label="Buscar"
        className="flex-1 bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-foreground-muted outline-none"
      />
    </form>
  );
}
