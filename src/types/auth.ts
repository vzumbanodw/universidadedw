export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: AuthErrorCode };

export type MagicLinkResult =
  | { ok: true }
  | { ok: false; error: AuthErrorCode };

export type AuthErrorCode =
  | "invalid_credentials"
  | "invalid_email"
  | "rate_limited"
  | "unknown";

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  invalid_credentials:
    "Não foi possível acessar. Verifique suas credenciais e tente novamente.",
  invalid_email: "Informe um e-mail válido.",
  rate_limited:
    "Muitas tentativas. Aguarde alguns instantes antes de tentar novamente.",
  unknown: "Algo deu errado. Tente novamente em instantes.",
};
