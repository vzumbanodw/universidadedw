"use client";

import { createContext, useContext, type ReactNode } from "react";
import { mockUser } from "@/data/mock-user";

/** Visão da identidade do usuário para a UI do dashboard. */
export type CurrentUserView = {
  name: string;
  firstName: string;
  email: string;
  role: string;
};

const CurrentUserContext = createContext<CurrentUserView | null>(null);

export function CurrentUserProvider({
  value,
  children,
}: {
  value: CurrentUserView | null;
  children: ReactNode;
}) {
  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

/**
 * Identidade do usuário logado. Em desenvolvimento sem Supabase configurado,
 * cai no `mockUser` para a UI continuar utilizável.
 */
export function useCurrentUser(): CurrentUserView {
  const ctx = useContext(CurrentUserContext);
  return (
    ctx ?? {
      name: mockUser.name,
      firstName: mockUser.firstName,
      email: mockUser.email,
      role: mockUser.role,
    }
  );
}
