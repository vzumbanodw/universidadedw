import type {
  AuthResult,
  LoginCredentials,
  MagicLinkResult,
} from "@/types/auth";
import { sleep } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mock authentication — replace with a real provider (Auth.js, Clerk, Supabase…)
 * by swapping this module's exports. Component layer doesn't need to change.
 */
export async function loginWithEmailAndPassword({
  email,
  password,
}: LoginCredentials): Promise<AuthResult> {
  await sleep(900);

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "invalid_email" };
  }

  if (password.length < 4) {
    return { ok: false, error: "invalid_credentials" };
  }

  return {
    ok: true,
    user: {
      id: "u_mock_001",
      email,
      name: email.split("@")[0] ?? "Estudante",
    },
  };
}

export async function sendMagicLink(email: string): Promise<MagicLinkResult> {
  await sleep(700);

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "invalid_email" };
  }

  return { ok: true };
}
