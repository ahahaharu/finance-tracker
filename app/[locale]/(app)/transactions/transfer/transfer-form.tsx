"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import type { Currency } from "@/lib/generated/prisma/enums";

import type { TransferFormState } from "./actions";

type WalletOption = { id: string; name: string; currency: Currency };

type TransferFormProps = {
  action: (
    state: TransferFormState,
    formData: FormData,
  ) => Promise<TransferFormState>;
  wallets: readonly WalletOption[];
  now: string;
};

const initialState: TransferFormState = {};

function TransferForm({ action, wallets, now }: TransferFormProps) {
  const t = useTranslations("transfers");
  const [fromWalletId, setFromWalletId] = useState<string>(
    wallets[0]?.id ?? "",
  );
  const [toWalletId, setToWalletId] = useState<string>(wallets[1]?.id ?? "");
  const [state, formAction, pending] = useActionState(action, initialState);

  const options = wallets.map((wallet) => ({
    value: wallet.id,
    label: `${wallet.name} · ${wallet.currency}`,
  }));

  const currencyOf = (id: string) =>
    wallets.find((wallet) => wallet.id === id)?.currency;

  const crossCurrency =
    currencyOf(fromWalletId) !== undefined &&
    currencyOf(toWalletId) !== undefined &&
    currencyOf(fromWalletId) !== currencyOf(toWalletId);

  return (
    <form
      action={formAction}
      className="flex w-full max-w-[320px] flex-col gap-4"
      noValidate
    >
      <Select
        name="fromWalletId"
        value={fromWalletId}
        onValueChange={(value) => setFromWalletId(value ?? "")}
        options={options}
        label={t("fields.from")}
        error={
          state.code === "SAME_WALLET_TRANSFER"
            ? t("errors.SAME_WALLET_TRANSFER")
            : state.invalid?.includes("fromWalletId")
              ? t("fieldErrors.wallet")
              : undefined
        }
      />

      <Select
        name="toWalletId"
        value={toWalletId}
        onValueChange={(value) => setToWalletId(value ?? "")}
        options={options}
        label={t("fields.to")}
        error={
          state.invalid?.includes("toWalletId")
            ? t("fieldErrors.wallet")
            : undefined
        }
      />

      <Input
        name="amountFrom"
        inputMode="decimal"
        placeholder={t("placeholders.amount")}
        label={
          crossCurrency
            ? t("fields.amountFromIn", { currency: currencyOf(fromWalletId)! })
            : t("fields.amount")
        }
        error={
          state.invalid?.includes("amountFrom")
            ? t("fieldErrors.amount")
            : undefined
        }
      />

      {crossCurrency ? (
        <div className="flex flex-col gap-1.5">
          <Input
            name="amountTo"
            inputMode="decimal"
            placeholder={t("placeholders.amount")}
            label={t("fields.amountToIn", {
              currency: currencyOf(toWalletId)!,
            })}
            error={
              state.invalid?.includes("amountTo")
                ? t("fieldErrors.amountTo")
                : undefined
            }
          />
          <p className="text-12 text-ink-faint">{t("hints.crossCurrency")}</p>
        </div>
      ) : null}

      <Input
        name="occurredAt"
        type="datetime-local"
        max={now}
        defaultValue={now}
        label={t("fields.occurredAt")}
        error={
          state.code === "FUTURE_DATE"
            ? t("errors.FUTURE_DATE")
            : state.invalid?.includes("occurredAt")
              ? t("fieldErrors.occurredAt")
              : undefined
        }
      />

      <Input
        name="note"
        placeholder={t("placeholders.note")}
        label={t("fields.note")}
        error={
          state.invalid?.includes("note") ? t("fieldErrors.note") : undefined
        }
      />

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {t("form.create")}
        </Button>
        <Link
          href="/transactions"
          className="flex h-control items-center px-3 text-13 text-ink-muted hover:text-ink"
        >
          {t("form.cancel")}
        </Link>
      </div>

      {state.code === "RATE_NOT_AVAILABLE" || state.code === "NOT_FOUND" ? (
        <p className="text-12 text-negative">{t(`errors.${state.code}`)}</p>
      ) : null}
    </form>
  );
}

export { TransferForm };
