import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Amount } from "@/components/ui/amount";
import { BudgetStatus } from "@/components/ui/budget-status";
import { Button, buttonVariants } from "@/components/ui/button";
import { CategoryDot } from "@/components/ui/category-dot";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import { listBudgets } from "@/lib/services/budget";
import { cn } from "@/lib/utils";

import { deleteBudgetAction } from "./actions";

async function BudgetsList({
  locale,
  month,
}: {
  locale: Locale;
  month: string;
}) {
  const user = await requireUser();
  const [budgets, t] = await Promise.all([
    listBudgets(user.id, month),
    getTranslations("budgets"),
  ]);

  return (
    <>
      {budgets.length === 0 ? (
        <EmptyState
          message={t("empty")}
          action={
            <Link
              href={{ pathname: "/budgets/new", query: { month } }}
              className={buttonVariants({ variant: "secondary" })}
            >
              {t("add")}
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col">
          {budgets.map((budget) => (
            <li
              key={budget.id}
              className="flex flex-col gap-2 border-b border-line py-3"
            >
              <div className="flex items-center justify-between gap-4">
                <Link
                  href={{
                    pathname: `/budgets/${budget.id}`,
                    query: { month },
                  }}
                  className="flex items-center gap-2 text-13 text-ink"
                >
                  <CategoryDot color={budget.categoryColor} />
                  {budget.categoryName}
                </Link>

                <div className="flex items-center gap-3">
                  <span className="flex items-baseline gap-1">
                    <Amount
                      minor={budget.spentAmount}
                      currency={budget.currency}
                    />
                    <span className="text-12 text-ink-faint">/</span>
                    <Amount
                      minor={budget.limitAmount}
                      currency={budget.currency}
                    />
                  </span>
                  <BudgetStatus ratio={budget.usedPercent / 100} />
                  <details className="group flex items-center gap-1">
                    <summary
                      className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "cursor-default list-none [&::-webkit-details-marker]:hidden",
                      )}
                    >
                      <span className="group-open:hidden">
                        {t("actions.delete")}
                      </span>
                      <span className="hidden group-open:inline">
                        {t("actions.cancel")}
                      </span>
                    </summary>
                    <form action={deleteBudgetAction.bind(null, locale)}>
                      <input type="hidden" name="budgetId" value={budget.id} />
                      <input type="hidden" name="month" value={month} />
                      <Button type="submit" variant="destructive">
                        {t("actions.confirmDelete")}
                      </Button>
                    </form>
                  </details>
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-4 text-12 text-ink-muted">
                <span>
                  {budget.isExceeded ? t("over") : t("remaining")}{" "}
                  <Amount
                    minor={Math.abs(budget.remainingAmount)}
                    currency={budget.currency}
                  />
                </span>
                <span className="font-mono tabular-nums">
                  {t("percent", { percent: budget.usedPercent })}
                </span>
              </div>

              <div className="h-[3px] w-full bg-sunken">
                <div
                  className={cn(
                    "h-full",
                    budget.isExceeded ? "bg-negative" : "bg-ink",
                  )}
                  style={{ width: `${Math.min(budget.usedPercent, 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export { BudgetsList };
