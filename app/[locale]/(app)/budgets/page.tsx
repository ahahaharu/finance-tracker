import { Suspense } from "react";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
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
  const failed = single(query.error) !== undefined;
  const [t, formatter] = await Promise.all([
    getTranslations("budgets"),
    getFormatter(),
  ]);

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

      <Suspense
        key={month}
        fallback={<Skeleton rows={4} columns={3} header={false} />}
      >
        <BudgetsList locale={locale} month={month} />
      </Suspense>
    </div>
  );
}
