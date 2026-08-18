"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Currency } from "@/lib/generated/prisma/enums";

import { type AuthFormState, registerAction } from "./actions";

const initialState: AuthFormState = {};

const currencyOptions = Object.values(Currency).map((currency) => ({
  value: currency,
  label: currency,
}));

function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [baseCurrency, setBaseCurrency] = useState<string>(Currency.BYN);
  const [state, formAction, pending] = useActionState(
    registerAction.bind(null, locale),
    initialState,
  );

  const passwordInvalid = state.invalid?.includes("password") ?? false;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-20 font-medium">{t("register.title")}</h1>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <Input
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          label={t("fields.name")}
          error={
            state.invalid?.includes("name") ? t("fieldErrors.name") : undefined
          }
        />
        <Input
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          label={t("fields.email")}
          error={
            state.code === "EMAIL_TAKEN"
              ? t("errors.EMAIL_TAKEN")
              : state.invalid?.includes("email")
                ? t("fieldErrors.email")
                : undefined
          }
        />
        <div className="flex flex-col gap-1.5">
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            label={t("fields.password")}
            error={passwordInvalid ? t("fieldErrors.password") : undefined}
          />
          {passwordInvalid ? null : (
            <p className="text-12 text-ink-faint">{t("hints.password")}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Select
            name="baseCurrency"
            value={baseCurrency}
            onValueChange={(value) => setBaseCurrency(value ?? Currency.BYN)}
            options={currencyOptions}
            label={t("fields.baseCurrency")}
            error={
              state.invalid?.includes("baseCurrency")
                ? t("fieldErrors.baseCurrency")
                : undefined
            }
          />
          <p className="text-12 text-ink-faint">{t("hints.baseCurrency")}</p>
        </div>

        <Button type="submit" variant="primary" disabled={pending}>
          {t("register.submit")}
        </Button>
      </form>

      <p className="text-12 text-ink-muted">
        {t("register.hasAccount")}{" "}
        <Link href="/login" className="text-ink underline underline-offset-2">
          {t("register.loginLink")}
        </Link>
      </p>
    </div>
  );
}

export { RegisterForm };
