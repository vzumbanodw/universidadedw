"use client";

import { useEffect, useState } from "react";
import { Menu, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useCurrentUser } from "@/components/auth/CurrentUserProvider";
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

        {/* Avatar */}
        <button
          type="button"
          aria-label="Abrir menu do usuário"
          className="rounded-full transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Avatar name={user.name} size="md" ring />
        </button>
      </div>
    </header>
  );
}

function SearchInput() {
  return (
    <div className="relative flex h-10 w-full items-center rounded-regular border border-border-subtle bg-background-subtle transition-colors focus-within:border-foreground-subtitle focus-within:bg-background-elevated">
      <Search
        aria-hidden
        className="ml-3 h-4 w-4 shrink-0 text-foreground-muted"
      />
      <input
        type="search"
        placeholder="Buscar aplicações, cursos ou certificados..."
        aria-label="Buscar"
        className="flex-1 bg-transparent px-3 text-[13.5px] text-foreground placeholder:text-foreground-muted outline-none"
      />
    </div>
  );
}
