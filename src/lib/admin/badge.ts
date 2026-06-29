import type { TrackCategoryAccent } from "@/types/admin";

type BadgeVariant =
  | "neutral"
  | "primary"
  | "success"
  | "info"
  | "orange"
  | "violet";

/** Mapeia o accent das categorias/trilhas/níveis para a variante de Badge. */
export function accentToBadge(accent: TrackCategoryAccent): BadgeVariant {
  switch (accent) {
    case "teal":
    case "tertiary":
      return "primary";
    case "green":
      return "success";
    case "orange":
      return "orange";
    case "violet":
      return "violet";
    case "info":
    case "navy":
      return "info";
    default:
      return "neutral";
  }
}
