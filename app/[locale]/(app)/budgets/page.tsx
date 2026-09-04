import { Suspense } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { LinkPending } from "@/components/ui/link-pending";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { toLocale } from "@/i18n/routing";
import { monthRange } from "@/lib/services/budget";

import { readMonth, shiftMonth, single } from "../month";
import { BudgetsList } from "./budgets-list";

const monthFormat = { month: "long", year: "numeric" } as const;

export default async function BudgetsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/budgets">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const query = await searchParams;
  const month = readMonth(query);
  const failed = single(query.budgetId) !== undefined;
  const [t, formatter] = await Promise.all([
    getTranslations("budgets"),
    getFormatter(),
  ]);

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-20 font-medium">{t("title")}</h1>
        <Link
          href={{ pathname: "/budgets/new", query: { month } }}
          className={buttonVariants({ variant: "primary" })}
        >
          {t("add")}
          <LinkPending />
        </Link>
      </div>

      <nav className="flex items-center gap-1">
        <Link
          href={{ pathname: "/budgets", query: { month: shiftMonth(month, -1) } }}
          aria-label={t("months.previous")}
          className={buttonVariants({ variant: "secondary", size: "icon" })}
        >
          <ChevronLeft />
        </Link>
        <span className="flex h-control w-56 items-center justify-center text-14">
          {formatter.dateTime(monthRange(month).from, monthFormat)}
        </span>
        <Link
          href={{ pathname: "/budgets", query: { month: shiftMonth(month, 1) } }}
          aria-label={t("months.next")}
          className={buttonVariants({ variant: "secondary", size: "icon" })}
        >
          <ChevronRight />
        </Link>
        <span className="ml-2 flex w-28 justify-start">
          {month === format(new Date(), "yyyy-MM") ? null : (
            <Link
              href="/budgets"
              className={buttonVariants({ variant: "ghost" })}
            >
              {t("months.current")}
            </Link>
          )}
        </span>
      </nav>

      {failed ? (
        <p className="text-12 text-negative">{t("errors.NOT_FOUND")}</p>
      ) : null}

      <Suspense
        key={month}
        fallback={<Skeleton rows={4} columns={3} header={false} />}
      >
        <BudgetsList month={month} />
      </Suspense>
    </div>
  );
}
