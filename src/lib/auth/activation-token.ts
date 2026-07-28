import { randomBytes } from "crypto";

/**
 * Token de ativação: link pessoal enviado por e-mail após a aprovação de uma
 * solicitação (acesso ou redefinição de senha). 48 caracteres hex (192 bits) —
 * impossível de adivinhar; identifica o e-mail do solicitante na página
 * /primeiro-acesso sem depender de digitação.
 */
export function newActivationToken(): string {
  return randomBytes(24).toString("hex");
}
