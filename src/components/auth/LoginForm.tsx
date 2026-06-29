"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { PasswordField } from "./PasswordField";

import { loginSchema, type LoginFormValues } from "@/lib/validators/login-schema";
import { loginWithEmailAndPassword } from "@/lib/auth/client";
import { AUTH_ERROR_MESSAGES } from "@/types/auth";

export function LoginForm() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
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

      <PasswordField
        placeholder="••••••••"
        autoComplete="current-password"
        required
        error={errors.password?.message}
        {...register("password")}
      />

      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        Entrar
      </Button>

      <p className="text-center text-[13px] leading-relaxed text-foreground-disabled">
        O acesso é fornecido pela sua empresa. Sem login?{" "}
        <a
          href="https://suporte.dataweb.com.br/hc/pt-br/requests/new"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground-brand underline-offset-4 hover:underline"
        >
          Falar com o suporte
        </a>
      </p>
    </form>
  );
}
