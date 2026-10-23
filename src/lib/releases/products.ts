/**
 * Catálogo oficial de PRODUTOS Dataweb usado nas notas de atualização.
 *
 * Lista controlada (em vez de texto livre) por dois motivos: o filtro por
 * produto na página pública só funciona com valores consistentes, e o operador
 * não precisa lembrar como grafou "optfacil" da última vez.
 *
 * Valores antigos, digitados antes desta lista, continuam aparecendo: a página
 * os normaliza pelo rótulo e, quando não reconhece, mantém o texto original.
 */
export const RELEASE_PRODUCTS = [
  "OptFácil",
  "Analytics",
  "CRM",
  "PDV",
  "Dilab",
  "Indústria",
  "Consultor Externo",
  "SmartScanner",
] as const;

export type ReleaseProduct = (typeof RELEASE_PRODUCTS)[number];

export const RELEASE_PRODUCT_OPTIONS = RELEASE_PRODUCTS.map((p) => ({
  value: p,
  label: p,
}));

/** Comparação tolerante a acento, caixa e espaços ("optfacil" = "OptFácil"). */
function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const BY_KEY = new Map(RELEASE_PRODUCTS.map((p) => [normalizeKey(p), p]));

/**
 * Converte o texto gravado no item para o nome oficial do produto. Devolve o
 * próprio texto (apenas limpo) quando não houver correspondência — nada é
 * escondido do cliente por causa de um cadastro antigo.
 */
export function canonicalProduct(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  return BY_KEY.get(normalizeKey(value)) ?? value;
}
