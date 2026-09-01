import { format } from "date-fns";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { decodeFailure } from "@/lib/forms/state";
import { listCategories } from "@/lib/services/category";

import { createBudgetAction } from "../actions";
import { BudgetForm } from "../budget-form";
import { budgetFormErrorCodes } from "../failure";

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export default async function NewBudgetPage({
  params,
  searchParams,
}: PageProps<"/[locale]/budgets/new">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const user = await requireUser();
  const query = await searchParams;
  const requested = Array.isArray(query.month) ? query.month[0] : query.month;
  const month =
    requested && monthPattern.test(requested)
      ? requested
      : format(new Date(), "yyyy-MM");

  const [categories, t] = await Promise.all([
    listCategories(user.id, { kind: "EXPENSE" }),
    getTranslations("budgets"),
  ]);

  return (
    <div className="flex flex-col gap-section">
      <h1 className="text-20 font-medium">{t("form.createTitle")}</h1>
      {categories.items.length === 0 ? (
        <p className="text-13 text-ink-muted">{t("needsCategory")}</p>
      ) : (
        <BudgetForm
          action={createBudgetAction.bind(null, locale)}
          categories={categories.items}
          month={month}
          initialState={decodeFailure(query, budgetFormErrorCodes)}
        />
      )}
    </div>
  );
}
