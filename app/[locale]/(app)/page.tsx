import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Skeleton } from "@/components/ui/skeleton";
import { toLocale } from "@/i18n/routing";

import { OverviewRecent } from "./overview-recent";
import { OverviewSpending } from "./overview-spending";
import { OverviewSummary } from "./overview-summary";
import {
  periodKey,
  periodMonth,
  periodRange,
  readPeriod,
  today,
} from "./period";
import { PeriodBar } from "./period-bar";

export default async function Home({
  params,
  searchParams,
}: PageProps<"/[locale]">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const now = today();
  const state = readPeriod(await searchParams, now);
  const period = periodRange(state);
  const key = periodKey(state);
  const t = await getTranslations("dashboard");

  return (
    <div className="flex flex-col gap-section">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-line pb-4">
        <h1 className="text-20 font-medium">{t("title")}</h1>
        <PeriodBar state={state} action={`/${locale}`} now={now} />
        <span />
      </div>

      <Suspense
        key={`summary-${key}`}
        fallback={<Skeleton rows={4} columns={2} header={false} />}
      >
        <OverviewSummary period={period} />
      </Suspense>

      <Suspense
        key={`spending-${key}`}
        fallback={<Skeleton rows={6} columns={3} header={false} />}
      >
        <OverviewSpending period={period} month={periodMonth(state, now)} />
      </Suspense>

      <Suspense fallback={<Skeleton rows={8} columns={5} />}>
        <OverviewRecent />
      </Suspense>
    </div>
  );
}
