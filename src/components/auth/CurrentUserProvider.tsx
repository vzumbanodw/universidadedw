"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Visão da identidade do usuário para a UI do dashboard. */
export type CurrentUserView = {
  name: string;
  firstName: string;
  email: string;
  role: string;
};

/** Identidade neutra quando não há sessão (nunca expõe dados de exemplo). */
const FALLBACK_USER: CurrentUserView = {
  name: "Aluno",
  firstName: "Aluno",
  email: "",
  role: "Aluno",
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
 * Identidade do usuário logado. Sem sessão (ex.: acesso direto em dev sem
 * Supabase), cai numa identidade neutra — nunca em dados de exemplo.
 */
export function useCurrentUser(): CurrentUserView {
  return useContext(CurrentUserContext) ?? FALLBACK_USER;
}
