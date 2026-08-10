/**
 * Registro de ações no histórico nominal do backoffice, a partir dos diálogos
 * do cliente (cadastro/edição de empresas e funcionários etc.). O servidor
 * carimba a identidade do operador LOGADO; aqui vai só a descrição.
 *
 * Fire-and-forget: falha de rede não interrompe a ação do operador.
 */
export function logAction(action: string): void {
  try {
    void fetch("/api/admin/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* nunca interrompe o fluxo por causa do histórico */
  }
}
