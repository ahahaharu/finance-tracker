import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Amount } from "@/components/ui/amount";
import { BudgetStatus } from "@/components/ui/budget-status";
import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import { decodeFailure } from "@/lib/forms/state";
import { type BudgetView, getBudget } from "@/lib/services/budget";

import { updateBudgetAction } from "../actions";
import { BudgetForm } from "../budget-form";
import { budgetFormErrorCodes } from "../failure";

export default async function BudgetPage({
  params,
  searchParams,
}: PageProps<"/[locale]/budgets/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const user = await requireUser();

  let budget: BudgetView;

  try {
    budget = await getBudget(user.id, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }

  const t = await getTranslations("budgets");

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-baseline justify-between">
        <h1 className="text-20 font-medium">{t("form.editTitle")}</h1>
        <div className="flex items-center gap-3">
          <Amount minor={budget.spentAmount} currency={budget.currency} />
          <BudgetStatus ratio={budget.usedPercent / 100} />
        </div>
      </div>

      <BudgetForm
        action={updateBudgetAction.bind(null, locale, budget.id, budget.month)}
        categories={[]}
        month={budget.month}
        budget={{
          categoryId: budget.categoryId,
          categoryName: budget.categoryName,
          limitAmount: budget.limitAmount,
        }}
        initialState={decodeFailure(await searchParams, budgetFormErrorCodes)}
      />
    </div>
  );
}
