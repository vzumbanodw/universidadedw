import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Backoffice · Universidade Dataweb",
  description:
    "Gestão de conteúdo, cursos, aulas e acessos da Universidade Dataweb.",
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
