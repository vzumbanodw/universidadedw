import type {
  CourseFormat,
  LearningLevel,
  ReleaseEntryType,
  TrackCategoryAccent,
  TrackCategoryIcon,
  TrackCategoryType,
} from "@/types/admin";

/**
 * Listas de opções centralizadas para os formulários do backoffice.
 * Espelham exatamente os union types consumidos pelo app do aluno, garantindo
 * que o conteúdo criado siga as mesmas regras visuais e de informação.
 */

export const CATEGORY_TYPE_OPTIONS: { value: TrackCategoryType; label: string }[] = [
  { value: "aplicacao", label: "Aplicação" },
  { value: "modulo", label: "Módulo" },
];

export const ICON_OPTIONS: { value: TrackCategoryIcon; label: string }[] = [
  { value: "chart", label: "Gráfico (Analytics)" },
  { value: "users", label: "Pessoas (CRM)" },
  { value: "flask", label: "Frasco (Laboratório)" },
  { value: "clipboard", label: "Prancheta" },
  { value: "file-text", label: "Documento (PDF)" },
  { value: "wallet", label: "Carteira (Financeiro)" },
  { value: "building", label: "Prédio (Administrativo)" },
  { value: "headset", label: "Headset (Consultor)" },
  { value: "credit-card", label: "Cartão (Crediário)" },
  { value: "factory", label: "Fábrica (Indústria)" },
];

export const ACCENT_OPTIONS: { value: TrackCategoryAccent; label: string; swatch: string }[] = [
  { value: "teal", label: "Teal", swatch: "#00A0B1" },
  { value: "navy", label: "Navy", swatch: "#00394A" },
  { value: "tertiary", label: "Azul", swatch: "#1D6076" },
  { value: "orange", label: "Laranja", swatch: "#FBB040" },
  { value: "green", label: "Verde", swatch: "#A6CE39" },
  { value: "red", label: "Vermelho", swatch: "#F8473A" },
  { value: "violet", label: "Violeta", swatch: "#6C90FF" },
  { value: "info", label: "Informação", swatch: "#0047FF" },
  { value: "neutral", label: "Neutro", swatch: "#737373" },
];

export const LEVEL_OPTIONS: { value: LearningLevel; label: string }[] = [
  { value: "Iniciante", label: "Iniciante" },
  { value: "Intermediário", label: "Intermediário" },
  { value: "Avançado", label: "Avançado" },
];

export const FORMAT_OPTIONS: { value: CourseFormat; label: string }[] = [
  { value: "Videoaulas", label: "Videoaulas" },
  { value: "Prático", label: "Prático" },
  { value: "Ao vivo", label: "Ao vivo" },
  { value: "Certificação", label: "Certificação" },
];

export const RESOURCE_TYPE_OPTIONS: {
  value: "PDF" | "Checklist" | "Exercicio";
  label: string;
}[] = [
  { value: "PDF", label: "PDF" },
  { value: "Checklist", label: "Checklist" },
  { value: "Exercicio", label: "Exercício" },
];

export const MONTH_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export function monthLabel(month: number): string {
  return MONTH_OPTIONS.find((m) => m.value === String(month))?.label ?? "";
}

export const RELEASE_ENTRY_TYPE_OPTIONS: { value: ReleaseEntryType; label: string }[] = [
  { value: "novidade", label: "Novidade" },
  { value: "melhoria", label: "Melhoria" },
  { value: "correcao", label: "Correção" },
  { value: "seguranca", label: "Segurança" },
];

/** Lista de anos para o seletor: do próximo ano até 2023, em ordem decrescente. */
export function yearOptions(): { value: string; label: string }[] {
  const current = new Date().getFullYear();
  const years: { value: string; label: string }[] = [];
  for (let y = current + 1; y >= 2023; y -= 1) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

/** Gera um slug consistente com os hrefs usados no app do aluno. */
const DIACRITICS = /[̀-ͯ]/g;

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
