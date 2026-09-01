"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormFallback } from "@/components/form-fallback";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import { toMoneyInput } from "@/lib/format/money";
import { Currency, WalletType } from "@/lib/generated/prisma/enums";

import type { WalletFormState } from "./failure";

type WalletValues = {
  name: string;
  type: WalletType;
  currency: Currency;
  initialBalance: number;
};

type WalletFormProps = {
  action: (
    state: WalletFormState,
    formData: FormData,
  ) => Promise<WalletFormState>;
  wallet?: WalletValues;
  initialState: WalletFormState;
};

function WalletForm({ action, wallet, initialState }: WalletFormProps) {
  const t = useTranslations("wallets");
  const [type, setType] = useState<string>(wallet?.type ?? WalletType.CASH);
  const [currency, setCurrency] = useState<string>(
    wallet?.currency ?? Currency.BYN,
  );
  const [state, formAction, pending] = useActionState(action, initialState);

  const typeOptions = Object.values(WalletType).map((value) => ({
    value,
    label: t(`types.${value}`),
  }));

  const currencyOptions = Object.values(Currency).map((value) => ({
    value,
    label: value,
  }));

  return (
    <form
      action={formAction}
      className="flex w-full max-w-[320px] flex-col gap-4"
      noValidate
    >
      <FormFallback />
      <Input
        name="name"
        defaultValue={wallet?.name}
        label={t("fields.name")}
        placeholder={t("placeholders.name")}
        error={
          state.code === "WALLET_NAME_TAKEN"
            ? t("errors.WALLET_NAME_TAKEN")
            : state.invalid?.includes("name")
              ? t("fieldErrors.name")
              : undefined
        }
      />

      <Select
        name="type"
        value={type}
        onValueChange={(value) => setType(value ?? WalletType.CASH)}
        options={typeOptions}
        label={t("fields.type")}
        error={state.invalid?.includes("type") ? t("fieldErrors.type") : undefined}
      />

      {wallet ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-12 text-ink-muted">{t("fields.currency")}</span>
          <span className="text-13">{wallet.currency}</span>
          <p className="text-12 text-ink-faint">{t("hints.currencyFixed")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Select
            name="currency"
            value={currency}
            onValueChange={(value) => setCurrency(value ?? Currency.BYN)}
            options={currencyOptions}
            label={t("fields.currency")}
            error={
              state.invalid?.includes("currency")
                ? t("fieldErrors.currency")
                : undefined
            }
          />
          <p className="text-12 text-ink-faint">{t("hints.currencyFixed")}</p>
        </div>
      )}

      <Input
        name="initialBalance"
        inputMode="decimal"
        defaultValue={toMoneyInput(wallet?.initialBalance ?? 0)}
        label={t("fields.initialBalance")}
        error={
          state.invalid?.includes("initialBalance")
            ? t("fieldErrors.initialBalance")
            : undefined
        }
      />

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {wallet ? t("form.save") : t("form.create")}
        </Button>
        <Link
          href="/wallets"
          className="flex h-control items-center px-3 text-13 text-ink-muted hover:text-ink"
        >
          {t("form.cancel")}
        </Link>
      </div>

      {state.code === "NOT_FOUND" ? (
        <p className="text-12 text-negative">{t("errors.NOT_FOUND")}</p>
      ) : null}
    </form>
  );
}

export { WalletForm };
export type { WalletValues };
