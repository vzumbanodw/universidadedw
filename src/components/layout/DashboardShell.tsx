"use client";

import { useState, type ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { MobileNavigation } from "./MobileNavigation";
import {
  CurrentUserProvider,
  type CurrentUserView,
} from "@/components/auth/CurrentUserProvider";

export function DashboardShell({
  children,
  user = null,
}: {
  children: ReactNode;
  user?: CurrentUserView | null;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <CurrentUserProvider value={user}>
    <div className="min-h-screen bg-background-subtle text-foreground">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside
          aria-label="Barra lateral"
          className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-brand-dark bg-brand-dark lg:flex xl:w-[272px]"
        >
          <AppSidebar />
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar onOpenMobileNav={() => setMobileNavOpen(true)} />
          <main
            role="main"
            aria-label="Conteúdo principal"
            className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
          >
            {children}
          </main>
        </div>
      </div>

      {/* Mobile drawer */}
      <MobileNavigation
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
    </div>
    </CurrentUserProvider>
  );
}
