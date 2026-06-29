"use client";

import { useState, type ReactNode } from "react";
import { Menu, ShieldCheck, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { mockUser } from "@/data/mock-user";
import { AdminStoreProvider } from "@/lib/admin/store";
import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <AdminStoreProvider>
      <div className="min-h-screen bg-background-subtle text-foreground">
        <div className="flex min-h-screen">
          {/* Sidebar desktop */}
          <aside
            aria-label="Barra lateral do backoffice"
            className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-brand-dark bg-brand-dark lg:flex xl:w-[272px]"
          >
            <AdminSidebar />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Topbar */}
            <header
              role="banner"
              className="sticky top-0 z-30 border-b border-border-subtle bg-background-elevated/85 backdrop-blur-xl"
            >
              <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Abrir menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-regular border border-border-subtle text-foreground-muted transition-colors hover:bg-background-subtle lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="hidden min-w-0 flex-1 lg:block">
                  <p className="flex items-center gap-1.5 truncate text-[13px] text-foreground-muted">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" aria-hidden />
                    Backoffice · Gestão de conteúdo e acessos
                  </p>
                  <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground-heading">
                    Universidade Dataweb
                  </h1>
                </div>

                <div className="ml-auto flex items-center gap-3">
                  <span className="hidden text-right leading-tight sm:block">
                    <span className="block text-[12.5px] font-semibold text-foreground-heading">
                      {mockUser.firstName}
                    </span>
                    <span className="block text-[11px] text-foreground-muted">
                      Administrador
                    </span>
                  </span>
                  <Avatar name={mockUser.name} size="md" ring />
                </div>
              </div>
            </header>

            <main
              role="main"
              className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
            >
              {children}
            </main>
          </div>
        </div>

        {/* Drawer mobile */}
        {mobileNavOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-brand-dark/55 backdrop-blur-sm animate-fade-in"
            />
            <div className="absolute left-0 top-0 h-full w-[272px] animate-slide-in-left">
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Fechar"
                className="absolute -right-11 top-3 inline-flex h-9 w-9 items-center justify-center rounded-regular bg-white/10 text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <AdminSidebar onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </div>
        ) : null}
      </div>
    </AdminStoreProvider>
  );
}
