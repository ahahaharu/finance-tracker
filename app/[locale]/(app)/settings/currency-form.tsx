"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Currency } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

import type { SettingsFormState } from "./actions";

const initialState: SettingsFormState = {};

function CurrencyForm({
  action,
  baseCurrency,
}: {
  action: (
    state: SettingsFormState,
    formData: FormData,
  ) => Promise<SettingsFormState>;
  baseCurrency: Currency;
}) {
  const t = useTranslations("settings");
  const [currency, setCurrency] = useState<string>(baseCurrency);
  const [state, formAction, pending] = useActionState(action, initialState);

  const options = Object.values(Currency).map((value) => ({
    value,
    label: value,
  }));

  return (
    <form
      action={formAction}
      className="flex w-full max-w-[320px] flex-col gap-4"
      noValidate
    >
      <Select
        name="baseCurrency"
        value={currency}
        onValueChange={(value) => setCurrency(value ?? baseCurrency)}
        options={options}
        label={t("fields.baseCurrency")}
      />

      <p className="text-12 text-ink-faint">{t("hints.rebase")}</p>

      {currency === baseCurrency ? (
        <span className="text-12 text-ink-faint">{t("hints.sameCurrency")}</span>
      ) : (
        <details className="group flex flex-col gap-2">
          <summary
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "w-fit cursor-default list-none [&::-webkit-details-marker]:hidden",
            )}
          >
            <span className="group-open:hidden">{t("actions.change")}</span>
            <span className="hidden group-open:inline">
              {t("actions.cancel")}
            </span>
          </summary>
          <p className="pt-2 text-12 text-ink-muted">
            {t("hints.confirmRebase", { currency })}
          </p>
          <Button
            type="submit"
            variant="primary"
            disabled={pending}
            className="mt-2 w-fit"
          >
            {t("actions.confirmChange")}
          </Button>
        </details>
      )}

      {state.code === "RATE_NOT_AVAILABLE" ? (
        <p className="text-12 text-negative">
          {t("errors.RATE_NOT_AVAILABLE")}
        </p>
      ) : null}
      {state.saved ? (
        <span className="text-12 text-ink-muted">{t("currencyChanged")}</span>
      ) : null}
    </form>
  );
}

export { CurrencyForm };
