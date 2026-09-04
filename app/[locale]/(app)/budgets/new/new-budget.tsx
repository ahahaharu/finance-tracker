import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import { decodeFailure, type SearchParams } from "@/lib/forms/state";
import { listCategories } from "@/lib/services/category";

import { readMonth } from "../../month";
import { createBudgetAction } from "../actions";
import { BudgetForm } from "../budget-form";
import { budgetFormErrorCodes } from "../failure";

async function NewBudget({
  locale,
  query,
}: {
  locale: Locale;
  query: SearchParams;
}) {
  const user = await requireUser();
  const [categories, t, categoriesText] = await Promise.all([
    listCategories(user.id, { kind: "EXPENSE" }),
    getTranslations("budgets"),
    getTranslations("categories"),
  ]);

  if (categories.items.length === 0) {
    return (
      <EmptyState
        message={t("needsCategory")}
        action={
          <Link
            href="/categories/new?kind=EXPENSE"
            className={buttonVariants({ variant: "secondary" })}
          >
            {categoriesText("add")}
          </Link>
        }
      />
    );
  }

  return (
    <BudgetForm
      action={createBudgetAction.bind(null, locale)}
      categories={categories.items}
      month={readMonth(query)}
      initialState={decodeFailure(query, budgetFormErrorCodes)}
    />
  );
}

export { NewBudget };
