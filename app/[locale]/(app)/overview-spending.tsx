import { getFormatter, getTranslations } from "next-intl/server";

import { Amount } from "@/components/ui/amount";
import { BudgetStatus } from "@/components/ui/budget-status";
import { buttonVariants } from "@/components/ui/button";
import { CategoryDot } from "@/components/ui/category-dot";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionTitle } from "@/components/ui/section-title";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import {
  getCategoryBreakdown,
  getMonthlyTrend,
  type Period,
} from "@/lib/services/analytics";
import { listBudgets, monthRange } from "@/lib/services/budget";
import { cn } from "@/lib/utils";

import { BAR_ROW_HEIGHT, CategoryBars } from "./category-bars";
import { MonthlyChart } from "./monthly-chart";

const monthFormat = { month: "long", year: "numeric" } as const;

async function OverviewSpending({
  period,
  month,
}: {
  period: Period;
  month: string;
}) {
  const user = await requireUser();
  const [budgets, shares, trend, t, formatter] = await Promise.all([
    listBudgets(user.id, month),
    getCategoryBreakdown(user.id, user.baseCurrency, period),
    getMonthlyTrend(user.id, user.baseCurrency, new Date()),
    getTranslations("dashboard"),
    getFormatter(),
  ]);

  return (
    <div className="flex flex-col gap-section">
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <SectionTitle>{t("sections.budgets")}</SectionTitle>
          <span className="text-12 text-ink-muted">
            {formatter.dateTime(monthRange(month).from, monthFormat)}
          </span>
        </div>

        {budgets.length === 0 ? (
          <EmptyState
            message={t("empty.budgets")}
            action={
              <Link
                href={{ pathname: "/budgets/new", query: { month } }}
                className={buttonVariants({ variant: "secondary" })}
              >
                {t("actions.addBudget")}
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
                  </div>
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
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>{t("sections.categories")}</SectionTitle>

        {shares.length === 0 ? (
          <EmptyState
            message={t("empty.categories")}
            action={
              <Link
                href="/transactions"
                className={buttonVariants({ variant: "secondary" })}
              >
                {t("actions.addTransaction")}
              </Link>
            }
          />
        ) : (
          <div className="flex items-start gap-4">
            <ul className="flex w-44 shrink-0 flex-col">
              {shares.map((share) => (
                <li
                  key={share.categoryId}
                  className="flex items-center"
                  style={{ height: BAR_ROW_HEIGHT }}
                >
                  <CategoryDot color={share.color} name={share.name} />
                </li>
              ))}
            </ul>

            <div className="min-w-0 flex-1">
              <CategoryBars items={shares} />
            </div>

            <ul className="flex shrink-0 flex-col">
              {shares.map((share) => (
                <li
                  key={share.categoryId}
                  className="flex items-center justify-end gap-3"
                  style={{ height: BAR_ROW_HEIGHT }}
                >
                  <Amount minor={share.amount} currency={share.currency} />
                  <span className="w-12 text-right font-mono text-12 tabular-nums text-ink-muted">
                    {t("percent", { percent: share.share })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>{t("sections.monthly")}</SectionTitle>
        <MonthlyChart points={trend} />
      </section>
    </div>
  );
}

export { OverviewSpending };
