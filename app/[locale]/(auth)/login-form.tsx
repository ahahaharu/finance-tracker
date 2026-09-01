"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FormFallback } from "@/components/form-fallback";
import { Input } from "@/components/ui/input";

import { loginAction } from "./actions";
import type { AuthFormState } from "./failure";

function LoginForm({ initialState }: { initialState: AuthFormState }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [state, formAction, pending] = useActionState(
    loginAction.bind(null, locale),
    initialState,
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-20 font-medium">{t("login.title")}</h1>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <FormFallback />
        <Input
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          label={t("fields.email")}
          error={
            state.invalid?.includes("email") ? t("fieldErrors.email") : undefined
          }
        />
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          label={t("fields.password")}
          error={
            state.invalid?.includes("password")
              ? t("fieldErrors.passwordRequired")
              : undefined
          }
        />

        {state.code && state.code !== "VALIDATION_FAILED" ? (
          <p className="text-12 text-negative">{t(`errors.${state.code}`)}</p>
        ) : null}

        <Button type="submit" variant="primary" disabled={pending}>
          {t("login.submit")}
        </Button>
      </form>

      <p className="text-12 text-ink-muted">
        {t("login.noAccount")}{" "}
        <Link
          href="/register"
          className="text-ink underline underline-offset-2"
        >
          {t("login.registerLink")}
        </Link>
      </p>
    </div>
  );
}

export { LoginForm };
