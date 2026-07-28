import nodemailer from "nodemailer";

/**
 * E-mails transacionais da plataforma, enviados por SMTP — o remetente visível
 * é SEMPRE mcoser@dataweb.com.br (`MAIL_FROM`):
 *
 *   1. Aviso interno de NOVA SOLICITAÇÃO (acesso / esqueci minha senha),
 *      para mcoser@dataweb.com.br e eiglesias@dataweb.com.br.
 *   2. Confirmação ao solicitante quando a conta é APROVADA no backoffice.
 *
 * Provedor recomendado: RESEND (https://resend.com) com o domínio
 * dataweb.com.br verificado — o Google Workspace Starter não permite senhas
 * de app, então o Gmail SMTP não é uma opção. Configuração:
 *
 *   SMTP_HOST=smtp.resend.com
 *   SMTP_USER=resend
 *   SMTP_PASSWORD=<chave da API do Resend, começa com "re_">
 *   MAIL_FROM=mcoser@dataweb.com.br
 *
 * Qualquer outro provedor SMTP funciona com as mesmas variáveis. Opcionais:
 *   BACKOFFICE_NOTIFY_EMAIL   destinos do aviso interno, separados por vírgula
 *                             (default: mcoser@ e eiglesias@)
 *   SMTP_PORT / SMTP_SECURE   default 465 com TLS
 *   MAIL_FROM                 remetente visível (default: SMTP_USER)
 *   APP_URL                   URL pública do app, para links nos e-mails
 *
 * O envio nunca interfere no fluxo que o disparou: as rotas chamam via
 * `after()` (depois da resposta) e qualquer erro aqui é apenas logado.
 */

const DEFAULT_NOTIFY_TO = ["mcoser@dataweb.com.br", "eiglesias@dataweb.com.br"];

function notifyRecipients(): string[] {
  const env = (process.env.BACKOFFICE_NOTIFY_EMAIL ?? "").trim();
  if (!env) return DEFAULT_NOTIFY_TO;
  return env.split(",").map((e) => e.trim()).filter(Boolean);
}

function appUrl(): string {
  return (process.env.APP_URL ?? "").trim().replace(/\/$/, "");
}

/** Envio de baixo nível. Nunca lança: falha de SMTP é logada e engolida. */
async function sendMail(opts: {
  to: string | string[];
  subject: string;
  text: string;
}): Promise<void> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) {
    console.warn(
      `[email] SMTP_USER/SMTP_PASSWORD não configurados; e-mail "${opts.subject}" não enviado.`,
    );
    return;
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.resend.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE ?? "true") !== "false",
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  try {
    await transport.sendMail({
      from: `Universidade Dataweb <${process.env.MAIL_FROM || user}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
  } catch (error) {
    console.error(`[email] Falha ao enviar "${opts.subject}":`, error);
  } finally {
    transport.close();
  }
}

/* -------------------------------------------------------------------------- */
/* 1. Aviso interno: nova solicitação no backoffice                            */
/* -------------------------------------------------------------------------- */

export type BackofficeRequestNotice =
  | { kind: "access"; name: string; email: string; companyName?: string; cnpj?: string }
  | { kind: "password-reset"; email: string };

export async function notifyBackofficeNewRequest(
  notice: BackofficeRequestNotice,
): Promise<void> {
  const tipo =
    notice.kind === "access"
      ? "Solicitação de acesso"
      : "Redefinição de senha (esqueci minha senha)";

  const solicitante =
    notice.kind === "access"
      ? `${notice.name} — ${notice.email}${notice.companyName ? ` (${notice.companyName})` : ""}`
      : notice.email;

  const recebidaEm = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  const lines = [
    "Você tem uma nova solicitação no backoffice da Universidade Dataweb.",
    "",
    `Tipo: ${tipo}`,
    `Solicitante: ${solicitante}`,
  ];
  if (notice.kind === "access" && notice.cnpj) lines.push(`CNPJ: ${notice.cnpj}`);
  lines.push(`Recebida em: ${recebidaEm} (horário de Brasília)`);
  const url = appUrl();
  if (url) lines.push("", `Revisar: ${url}/admin/solicitacoes`);

  await sendMail({
    to: notifyRecipients(),
    subject: "Nova solicitação no backoffice — Universidade Dataweb",
    text: lines.join("\n"),
  });
}

/* -------------------------------------------------------------------------- */
/* 2. Confirmação ao solicitante: conta aprovada (link de criação de senha)    */
/* -------------------------------------------------------------------------- */

function activationLink(token?: string): string | null {
  const url = appUrl();
  if (!url || !token) {
    if (!url) {
      console.warn(
        "[email] APP_URL não configurada — e-mail de aprovação enviado SEM o link de criação de senha.",
      );
    }
    return null;
  }
  return `${url}/primeiro-acesso?token=${token}`;
}

export async function sendAccessApprovedEmail(input: {
  name: string;
  email: string;
  activationToken?: string;
}): Promise<void> {
  const link = activationLink(input.activationToken);
  const comoEntrar = link
    ? `Para começar, crie sua senha de acesso no link abaixo — ele é pessoal e já está vinculado ao seu e-mail:\n${link}`
    : "Para começar, responda este e-mail para receber o link de criação da sua senha de acesso.";

  const lines = [
    `Olá, ${input.name}!`,
    "",
    "Sua solicitação de acesso à Universidade Dataweb foi aprovada.",
    "",
    comoEntrar,
    "",
    "Qualquer dúvida, é só responder este e-mail.",
  ];

  await sendMail({
    to: input.email,
    subject: "Seu acesso à Universidade Dataweb foi aprovado",
    text: lines.join("\n"),
  });
}

/* -------------------------------------------------------------------------- */
/* 3. Redefinição de senha aprovada (link para definir a nova senha)           */
/* -------------------------------------------------------------------------- */

export async function sendPasswordResetApprovedEmail(input: {
  email: string;
  activationToken?: string;
}): Promise<void> {
  const link = activationLink(input.activationToken);
  const comoRedefinir = link
    ? `Defina a sua nova senha no link abaixo — ele é pessoal e já está vinculado ao seu e-mail:\n${link}`
    : "Responda este e-mail para receber o link de redefinição da sua senha.";

  const lines = [
    "Olá!",
    "",
    "Sua solicitação de redefinição de senha na Universidade Dataweb foi aprovada.",
    "",
    comoRedefinir,
    "",
    "Seu progresso (aulas concluídas e certificados) continua salvo.",
    "Qualquer dúvida, é só responder este e-mail.",
  ];

  await sendMail({
    to: input.email,
    subject: "Redefinição de senha aprovada — Universidade Dataweb",
    text: lines.join("\n"),
  });
}
