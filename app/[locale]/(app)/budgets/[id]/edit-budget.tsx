import { notFound } from "next/navigation";
import type { Locale } from "next-intl";

import { Amount } from "@/components/ui/amount";
import { BudgetStatus } from "@/components/ui/budget-status";
import { requireUser } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import { decodeFailure, type SearchParams } from "@/lib/forms/state";
import { type BudgetView, getBudget } from "@/lib/services/budget";

import { updateBudgetAction } from "../actions";
import { BudgetForm } from "../budget-form";
import { budgetFormErrorCodes } from "../failure";

async function EditBudget({
  locale,
  budgetId,
  query,
}: {
  locale: Locale;
  budgetId: string;
  query: SearchParams;
}) {
  const user = await requireUser();

  let budget: BudgetView;

  try {
    budget = await getBudget(user.id, budgetId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Amount minor={budget.spentAmount} currency={budget.currency} />
        <BudgetStatus ratio={budget.usedPercent / 100} />
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
        initialState={decodeFailure(query, budgetFormErrorCodes)}
      />
    </div>
  );
}

export { EditBudget };
