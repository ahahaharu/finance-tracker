"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormFallback } from "@/components/form-fallback";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import type { CategoryKind, Currency } from "@/lib/generated/prisma/enums";
import type { EntryType } from "@/lib/schemas/transaction";
import { toMoneyInput } from "@/lib/format/money";
import { entryTypes } from "@/lib/schemas/transaction";
import { cn } from "@/lib/utils";

import type { TransactionFormState } from "./failure";

type WalletOption = { id: string; name: string; currency: Currency };
type CategoryOption = { id: string; name: string; kind: CategoryKind };

type TransactionValues = {
  type: EntryType;
  amount: number;
  walletId: string;
  categoryId: string;
  occurredAt: string;
  note: string | null;
};

type TransactionFormProps = {
  action: (
    state: TransactionFormState,
    formData: FormData,
  ) => Promise<TransactionFormState>;
  wallets: readonly WalletOption[];
  categories: readonly CategoryOption[];
  transaction?: TransactionValues;
  now: string;
  variant?: "row" | "column";
  initialState: TransactionFormState;
};

function TransactionForm({
  action,
  wallets,
  categories,
  transaction,
  now,
  variant = "column",
  initialState,
}: TransactionFormProps) {
  const t = useTranslations("transactions");
  const [type, setType] = useState<string>(transaction?.type ?? "EXPENSE");
  const [walletId, setWalletId] = useState<string>(
    transaction?.walletId ?? wallets[0]?.id ?? "",
  );
  const [categoryId, setCategoryId] = useState<string>(
    transaction?.categoryId ?? "",
  );
  const [state, formAction, pending] = useActionState(action, initialState);

  const typeOptions = entryTypes.map((value) => ({
    value,
    label: t(`types.${value}`),
  }));

  const walletOptions = wallets.map((wallet) => ({
    value: wallet.id,
    label: `${wallet.name} · ${wallet.currency}`,
  }));

  const categoryOptions = categories
    .filter((category) => category.kind === type)
    .map((category) => ({ value: category.id, label: category.name }));

  const selectedCategory =
    categoryOptions.find((option) => option.value === categoryId)?.value ??
    categoryOptions[0]?.value ??
    "";

  return (
    <form
      action={formAction}
      className={cn(
        "flex gap-3",
        variant === "row"
          ? "flex-wrap items-end"
          : "w-full max-w-[320px] flex-col",
      )}
      noValidate
    >
      <FormFallback />
      <Select
        name="type"
        value={type}
        onValueChange={(value) => setType(value ?? "EXPENSE")}
        options={typeOptions}
        label={t("fields.type")}
        className={variant === "row" ? "w-36" : undefined}
      />

      <Input
        name="amount"
        inputMode="decimal"
        defaultValue={
          transaction ? toMoneyInput(transaction.amount) : undefined
        }
        placeholder={t("placeholders.amount")}
        label={t("fields.amount")}
        fieldClassName={variant === "row" ? "w-32" : undefined}
        error={
          state.invalid?.includes("amount") ? t("fieldErrors.amount") : undefined
        }
      />

      <Select
        name="walletId"
        value={walletId}
        onValueChange={(value) => setWalletId(value ?? "")}
        options={walletOptions}
        label={t("fields.wallet")}
        placeholder={t("placeholders.wallet")}
        className={variant === "row" ? "w-44" : undefined}
        error={
          state.invalid?.includes("walletId")
            ? t("fieldErrors.wallet")
            : undefined
        }
      />

      <Select
        name="categoryId"
        value={selectedCategory}
        onValueChange={(value) => setCategoryId(value ?? "")}
        options={categoryOptions}
        label={t("fields.category")}
        placeholder={t("placeholders.category")}
        className={variant === "row" ? "w-44" : undefined}
        error={
          state.code === "CATEGORY_KIND_MISMATCH"
            ? t("errors.CATEGORY_KIND_MISMATCH")
            : state.invalid?.includes("categoryId")
              ? t("fieldErrors.category")
              : undefined
        }
      />

      <Input
        name="occurredAt"
        type="datetime-local"
        max={now}
        defaultValue={transaction?.occurredAt ?? now}
        label={t("fields.occurredAt")}
        fieldClassName={variant === "row" ? "w-52" : undefined}
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
        defaultValue={transaction?.note ?? ""}
        placeholder={t("placeholders.note")}
        label={t("fields.note")}
        fieldClassName={variant === "row" ? "w-56" : undefined}
        error={
          state.invalid?.includes("note") ? t("fieldErrors.note") : undefined
        }
      />

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {transaction ? t("form.save") : t("form.create")}
        </Button>
        {transaction ? (
          <Link
            href="/transactions"
            className="flex h-control items-center px-3 text-13 text-ink-muted hover:text-ink"
          >
            {t("form.cancel")}
          </Link>
        ) : null}
      </div>

      {state.code === "RATE_NOT_AVAILABLE" || state.code === "NOT_FOUND" ? (
        <p className="w-full text-12 text-negative">
          {t(`errors.${state.code}`)}
        </p>
      ) : null}
    </form>
  );
}

export { TransactionForm };
export type { CategoryOption, TransactionValues, WalletOption };
