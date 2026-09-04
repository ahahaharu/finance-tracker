import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Confirm } from "@/components/ui/confirm";
import { requireUser } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import type { SearchParams } from "@/lib/forms/state";
import { type BudgetView, getBudget } from "@/lib/services/budget";

import { readMonth } from "../../../month";
import { deleteBudgetAction } from "../../actions";

async function DeleteBudget({
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

  const t = await getTranslations("budgets");
  const month = readMonth(query);

  return (
    <Confirm
      message={t("confirmDelete.message", { name: budget.categoryName })}
      action={deleteBudgetAction.bind(null, locale)}
      cancelHref={`/budgets?month=${month}`}
    >
      <input type="hidden" name="budgetId" value={budgetId} />
      <input type="hidden" name="month" value={month} />
    </Confirm>
  );
}

export { DeleteBudget };
