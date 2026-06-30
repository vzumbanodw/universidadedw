import type { ReleaseEntryType } from "@/types/admin";

/** Mapeia o tipo do item do changelog para a variante de Badge correspondente. */
export const ENTRY_BADGE_VARIANT: Record<
  ReleaseEntryType,
  "primary" | "success" | "error" | "info"
> = {
  novidade: "primary",
  melhoria: "success",
  correcao: "error",
  seguranca: "info",
};
