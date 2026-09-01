"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormFallback } from "@/components/form-fallback";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import { toMoneyInput } from "@/lib/format/money";

import type { BudgetFormState } from "./failure";

type CategoryOption = { id: string; name: string };

type BudgetValues = {
  categoryId: string;
  categoryName: string;
  limitAmount: number;
};

type BudgetFormProps = {
  action: (
    state: BudgetFormState,
    formData: FormData,
  ) => Promise<BudgetFormState>;
  categories: readonly CategoryOption[];
  month: string;
  budget?: BudgetValues;
  initialState: BudgetFormState;
};

function BudgetForm({
  action,
  categories,
  month,
  budget,
  initialState,
}: BudgetFormProps) {
  const t = useTranslations("budgets");
  const [categoryId, setCategoryId] = useState<string>(
    budget?.categoryId ?? categories[0]?.id ?? "",
  );
  const [state, formAction, pending] = useActionState(action, initialState);

  const options = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  return (
    <form
      action={formAction}
      className="flex w-full max-w-[320px] flex-col gap-4"
      noValidate
    >
      <FormFallback />
      <input type="hidden" name="month" value={month} />

      {budget ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-12 text-ink-muted">{t("fields.category")}</span>
          <span className="text-13">{budget.categoryName}</span>
          <p className="text-12 text-ink-faint">{t("hints.categoryFixed")}</p>
        </div>
      ) : (
        <Select
          name="categoryId"
          value={categoryId}
          onValueChange={(value) => setCategoryId(value ?? "")}
          options={options}
          label={t("fields.category")}
          placeholder={t("placeholders.category")}
          error={
            state.code === "BUDGET_EXISTS"
              ? t("errors.BUDGET_EXISTS")
              : state.code === "CATEGORY_KIND_MISMATCH"
                ? t("errors.CATEGORY_KIND_MISMATCH")
                : state.invalid?.includes("categoryId")
                  ? t("fieldErrors.category")
                  : undefined
          }
        />
      )}

      <Input
        name="limitAmount"
        inputMode="decimal"
        defaultValue={budget ? toMoneyInput(budget.limitAmount) : undefined}
        placeholder={t("placeholders.limit")}
        label={t("fields.limit")}
        error={
          state.invalid?.includes("limitAmount")
            ? t("fieldErrors.limit")
            : undefined
        }
      />

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {budget ? t("form.save") : t("form.create")}
        </Button>
        <Link
          href={{ pathname: "/budgets", query: { month } }}
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

export { BudgetForm };
export type { BudgetValues, CategoryOption };
