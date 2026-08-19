import { addMonths, format } from "date-fns";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { Amount } from "@/components/ui/amount";
import { BudgetStatus } from "@/components/ui/budget-status";
import { Button, buttonVariants } from "@/components/ui/button";
import { CategoryDot } from "@/components/ui/category-dot";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@/i18n/navigation";
import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { listBudgets, monthRange } from "@/lib/services/budget";
import { cn } from "@/lib/utils";

import { deleteBudgetAction } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

const monthFormat = { month: "long", year: "numeric" } as const;
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readMonth(query: SearchParams): string {
  const month = single(query.month);

  return month && monthPattern.test(month)
    ? month
    : format(new Date(), "yyyy-MM");
}

function shiftMonth(month: string, offset: number): string {
  return format(addMonths(monthRange(month).from, offset), "yyyy-MM");
}

export default async function BudgetsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/budgets">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const user = await requireUser();
  const query = await searchParams;
  const month = readMonth(query);
  const [budgets, t, formatter] = await Promise.all([
    listBudgets(user.id, month),
    getTranslations("budgets"),
    getFormatter(),
  ]);

  const failed = single(query.error) !== undefined;

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <h1 className="text-20 font-medium">{t("title")}</h1>
        <Link
          href={{ pathname: "/budgets/new", query: { month } }}
          className={buttonVariants({ variant: "primary" })}
        >
          {t("add")}
        </Link>
      </div>

      <nav className="flex items-center gap-3 text-13">
        <Link
          href={{ pathname: "/budgets", query: { month: shiftMonth(month, -1) } }}
          className="text-ink underline underline-offset-2"
        >
          {t("months.previous")}
        </Link>
        <span className="text-ink-muted">
          {formatter.dateTime(monthRange(month).from, monthFormat)}
        </span>
        <Link
          href={{ pathname: "/budgets", query: { month: shiftMonth(month, 1) } }}
          className="text-ink underline underline-offset-2"
        >
          {t("months.next")}
        </Link>
      </nav>

      {failed ? (
        <p className="text-12 text-negative">{t("errors.NOT_FOUND")}</p>
      ) : null}

      {budgets.length === 0 ? (
        <EmptyState message={t("empty")} />
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
    </div>
  );
}
