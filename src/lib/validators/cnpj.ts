/**
 * CNPJ: máscara e validação, já compatíveis com o formato ALFANUMÉRICO da
 * Receita Federal (em vigor desde julho/2026): os 12 primeiros caracteres
 * podem ser letras ou dígitos; os 2 dígitos verificadores são sempre números.
 * CNPJs 100% numéricos continuam funcionando normalmente.
 */

const WEIGHTS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const WEIGHTS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

/** Remove pontuação e normaliza para maiúsculas (ex.: "12.abc..." → "12ABC..."). */
export function stripCnpj(value: string): string {
  return value.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
}

/**
 * Aplica a máscara XX.XXX.XXX/XXXX-XX progressivamente (para digitação).
 * Aceita no máximo 14 caracteres úteis; os 2 últimos só aceitam dígitos.
 */
export function formatCnpj(value: string): string {
  const raw = stripCnpj(value);
  const base = raw.slice(0, 12);
  const dv = raw.slice(12, 14).replace(/[^0-9]/g, "");
  const chars = base + dv;

  let out = "";
  for (let i = 0; i < chars.length; i += 1) {
    if (i === 2 || i === 5) out += ".";
    if (i === 8) out += "/";
    if (i === 12) out += "-";
    out += chars[i];
  }
  return out;
}

/** Valida tamanho, formato e os dois dígitos verificadores. */
export function isValidCnpj(value: string): boolean {
  const raw = stripCnpj(value);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(raw)) return false;
  if (/^(.)\1{13}$/.test(raw)) return false; // sequências repetidas (ex.: 000…)

  // Algoritmo oficial: valor do caractere = código ASCII - 48 (dígitos valem
  // 0–9; letras valem 17+), pesos 2..9 da direita para a esquerda, módulo 11.
  const vals = raw.split("").map((c) => c.charCodeAt(0) - 48);
  const dv = (weights: number[]) => {
    const sum = weights.reduce((acc, w, i) => acc + (vals[i] ?? 0) * w, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  return dv(WEIGHTS_DV1) === vals[12] && dv(WEIGHTS_DV2) === vals[13];
}
