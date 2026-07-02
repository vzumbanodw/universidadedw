"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { PasswordField } from "./PasswordField";
import { AccessRequestModal } from "./AccessRequestModal";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

import { loginSchema, type LoginFormValues } from "@/lib/validators/login-schema";
import { loginWithEmailAndPassword } from "@/lib/auth/client";
import { AUTH_ERROR_MESSAGES } from "@/types/auth";

export function LoginForm() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const { ref: emailFormRef, ...emailRest } = register("email");

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function onSubmit(values: LoginFormValues) {
    setAuthError(null);
    const result = await loginWithEmailAndPassword({
      email: values.email.trim(),
      password: values.password,
    });

    if (!result.ok) {
      setAuthError(AUTH_ERROR_MESSAGES[result.error]);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FormError message={authError} />

      <Input
        label="E-mail corporativo"
        type="email"
        placeholder="voce@empresa.com"
        autoComplete="email"
        inputMode="email"
        required
        startIcon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        {...emailRest}
        ref={(el) => {
          emailFormRef(el);
          emailRef.current = el;
        }}
      />

      <div className="flex flex-col gap-1.5">
        <PasswordField
          placeholder="••••••••"
          autoComplete="current-password"
          required
          error={errors.password?.message}
          {...register("password")}
        />
        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="self-end text-[12.5px] font-medium text-foreground-brand underline-offset-4 hover:underline"
        >
          Esqueci minha senha
        </button>
      </div>

      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        Entrar
      </Button>

      <div className="flex flex-col gap-1 text-center text-[13px] leading-relaxed text-foreground-disabled">
        <p>
          Primeira vez aqui?{" "}
          <Link
            href="/primeiro-acesso"
            className="font-medium text-foreground-brand underline-offset-4 hover:underline"
          >
            Defina sua senha de acesso
          </Link>
        </p>
        <p>
          O acesso é fornecido pela sua empresa.{" "}
          <button
            type="button"
            onClick={() => setRequestOpen(true)}
            className="font-medium text-foreground-brand underline-offset-4 hover:underline"
          >
            Solicitar acesso ao sistema
          </button>
        </p>
      </div>

      <AccessRequestModal open={requestOpen} onClose={() => setRequestOpen(false)} />
      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </form>
  );
}
