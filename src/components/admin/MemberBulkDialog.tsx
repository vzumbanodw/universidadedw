"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Download, FileSpreadsheet, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAdminStore } from "@/lib/admin/store";
import { createId } from "@/lib/admin/options";
import { cn } from "@/lib/utils";
import type { CompanyMember } from "@/types/admin";

type MemberBulkDialogProps = {
  open: boolean;
  onClose: () => void;
  companyId: string;
};

type ParsedRow = {
  name: string;
  email: string;
  jobTitle: string;
  valid: boolean;
  duplicate: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Faz o parse das linhas (do Excel importado ou coladas). Ordem por linha:
 * Nome, Email, Cargo (cargo opcional). Aceita vírgula, ponto-e-vírgula ou tab.
 */
function parseBulk(raw: string, existingEmails: Set<string>): ParsedRow[] {
  const seen = new Set<string>();
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      const name = parts[0] ?? "";
      const email = (parts[1] ?? "").toLowerCase();
      const jobTitle = parts[2] ?? "";
      const validEmail = EMAIL_RE.test(email);
      const duplicate = existingEmails.has(email) || (validEmail && seen.has(email));
      if (validEmail) seen.add(email);
      return { name, email, jobTitle, valid: Boolean(name) && validEmail, duplicate };
    });
}

/** Converte a matriz da planilha em linhas "nome,email,cargo", pulando cabeçalho. */
function matrixToLines(matrix: unknown[][]): string {
  const rows = matrix
    .map((r) => (Array.isArray(r) ? r.map((c) => (c == null ? "" : String(c).trim())) : []))
    .filter((r) => r.some((c) => c !== ""));
  if (rows.length === 0) return "";
  const first = (rows[0] ?? []).map((c) => c.toLowerCase());
  const looksHeader = first.some((c) => /nome|name|e-?mail|cargo/.test(c));
  const dataRows = looksHeader ? rows.slice(1) : rows;
  return dataRows
    .map((r) => [r[0] ?? "", r[1] ?? "", r[2] ?? ""].join(","))
    .join("\n");
}

export function MemberBulkDialog({ open, onClose, companyId }: MemberBulkDialogProps) {
  const store = useAdminStore();
  const company = store.companies.find((c) => c.id === companyId);
  const currentMembers = store.membersForCompany(companyId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [raw, setRaw] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setRaw("");
    setFileName(null);
  }, [open]);

  const existingEmails = useMemo(
    () => new Set(currentMembers.map((m) => m.email.toLowerCase())),
    [currentMembers],
  );

  const rows = useMemo(() => parseBulk(raw, existingEmails), [raw, existingEmails]);
  const validRows = rows.filter((r) => r.valid && !r.duplicate);

  const seatsLeft = company ? company.seats - currentMembers.length : 0;
  const exceedsSeats = validRows.length > seatsLeft;

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;
      if (!sheet) {
        setError("A planilha está vazia.");
        return;
      }
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        blankrows: false,
      });
      const lines = matrixToLines(matrix);
      if (!lines) {
        setError("Não encontrei linhas com nome e email na planilha.");
        return;
      }
      setRaw(lines);
    } catch {
      setError("Não consegui ler a planilha. Use um arquivo .xlsx, .xls ou .csv.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nome", "Email", "Cargo (opcional)"],
      ["Maria Silva", "maria.silva@empresa.com.br", "Vendedora"],
      ["João Souza", "joao.souza@empresa.com.br", "Caixa"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Funcionários");
    XLSX.writeFile(wb, "modelo-funcionarios.xlsx");
  }

  function handleCreate() {
    if (validRows.length === 0) {
      setError("Adicione ao menos uma linha válida (nome e email).");
      return;
    }
    const now = new Date().toISOString();
    const members: CompanyMember[] = validRows.map((row) => ({
      id: createId("mb"),
      companyId,
      name: row.name,
      email: row.email,
      jobTitle: row.jobTitle || undefined,
      status: "invited",
      createdAt: now,
    }));
    store.addMembers(members);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Importar funcionários (Excel)"
      description="Suba uma planilha .xlsx/.csv com as colunas Nome e Email (Cargo é opcional). Cada funcionário recebe um acesso individual à Universidade."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            leftIcon={<UserPlus className="h-4 w-4" />}
            disabled={validRows.length === 0}
          >
            Adicionar {validRows.length > 0 ? `${validRows.length} ` : ""}funcionário
            {validRows.length === 1 ? "" : "s"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p
            role="alert"
            className="rounded-regular border border-border-error bg-background-error px-3.5 py-2.5 text-sm text-foreground-error"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={() => fileRef.current?.click()}
            >
              Escolher planilha
            </Button>
            <Button
              variant="ghost"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={downloadTemplate}
            >
              Baixar modelo
            </Button>
          </div>
          {fileName ? (
            <span className="truncate text-[12.5px] text-foreground-muted">
              {fileName} · {rows.length} linha{rows.length === 1 ? "" : "s"}
            </span>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onFile}
            className="hidden"
          />
        </div>

        <Textarea
          label="Ou cole a lista (Nome, Email, Cargo)"
          rows={5}
          hint="Uma pessoa por linha. O cargo é opcional. Separe por vírgula, ponto-e-vírgula ou tab."
          placeholder={
            "Maria Silva, maria.silva@empresa.com.br, Vendedora\nJoão Souza; joao.souza@empresa.com.br"
          }
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />

        {/* Resumo */}
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-foreground-muted">
          <Badge variant="neutral" size="sm">
            {validRows.length} válido{validRows.length === 1 ? "" : "s"}
          </Badge>
          {rows.length - validRows.length > 0 ? (
            <Badge variant="warning" size="sm">
              {rows.length - validRows.length} ignorado(s)
            </Badge>
          ) : null}
          {company ? (
            <span>
              {seatsLeft} de {company.seats} assento(s) disponível(is)
            </span>
          ) : null}
        </div>

        {exceedsSeats ? (
          <p className="flex items-start gap-2 rounded-regular border border-border-warning bg-background-warning px-3.5 py-2.5 text-[13px] text-foreground-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            A lista ultrapassa as licenças contratadas. Você ainda pode criar, mas
            revise o número de assentos da empresa.
          </p>
        ) : null}

        {/* Pré-visualização */}
        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-regular border border-border-subtle">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-background-subtle text-[11px] uppercase tracking-[0.08em] text-foreground-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Nome</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Cargo</th>
                  <th className="px-3 py-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.map((row, index) => (
                  <tr
                    key={index}
                    className={cn(!row.valid || row.duplicate ? "opacity-55" : undefined)}
                  >
                    <td className="px-3 py-2 text-foreground-heading">{row.name || "-"}</td>
                    <td className="px-3 py-2 text-foreground-subtitle">{row.email || "-"}</td>
                    <td className="px-3 py-2 text-foreground-muted">{row.jobTitle || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      {row.duplicate ? (
                        <Badge variant="warning" size="sm">
                          Duplicado
                        </Badge>
                      ) : row.valid ? (
                        <Badge variant="success" size="sm" dot>
                          Pronto
                        </Badge>
                      ) : (
                        <Badge variant="error" size="sm">
                          Inválido
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
