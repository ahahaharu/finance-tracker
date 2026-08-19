import {
  addDays,
  addMonths,
  addYears,
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";

import type { Currency } from "@/lib/generated/prisma/enums";
import { categoryRepository } from "@/lib/repositories/category";
import {
  type CategoryTotal,
  transactionRepository,
} from "@/lib/repositories/transaction";
import type { AnalyticsQuery } from "@/lib/schemas/analytics";
import { divideHalfUp } from "@/lib/services/exchange-rate";
import {
  summarise,
  type TransactionTotals,
} from "@/lib/services/transaction";
import {
  type BalanceOptions,
  listWallets,
  type TotalBalance,
} from "@/lib/services/wallet";

export const TREND_MONTHS = 6;

export const rangeKinds = ["day", "month", "year", "custom"] as const;

export type RangeKind = (typeof rangeKinds)[number];

export type Period = {
  from: Date;
  to: Date;
};

export function rangeBounds(
  range: RangeKind,
  anchor: Date,
  until: Date,
): Period {
  if (range === "day") {
    return { from: startOfDay(anchor), to: endOfDay(anchor) };
  }

  if (range === "year") {
    return { from: startOfYear(anchor), to: endOfYear(anchor) };
  }

  if (range === "custom") {
    return {
      from: startOfDay(anchor),
      to: endOfDay(until < anchor ? anchor : until),
    };
  }

  return { from: startOfMonth(anchor), to: endOfMonth(anchor) };
}

export function containsDate(period: Period, date: Date): boolean {
  return (
    date.getTime() >= period.from.getTime() &&
    date.getTime() <= period.to.getTime()
  );
}

export function canAdvance(period: Period, today: Date): boolean {
  return period.to.getTime() < startOfDay(today).getTime();
}

export function shiftAnchor(
  range: RangeKind,
  anchor: Date,
  offset: number,
): Date {
  if (range === "day") {
    return addDays(anchor, offset);
  }

  if (range === "year") {
    return addYears(anchor, offset);
  }

  return addMonths(anchor, offset);
}

export type AnalyticsSummary = {
  period: Period;
  totalBalance: TotalBalance;
  totals: TransactionTotals;
};

export type CategoryShare = {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
  share: number;
  currency: Currency;
};

export type MonthlyPoint = {
  month: string;
  income: number;
  expense: number;
  currency: Currency;
};

export function periodOf(query: AnalyticsQuery, now: Date): Period {
  return {
    from: query.from
      ? startOfDay(new Date(`${query.from}T00:00:00`))
      : startOfMonth(now),
    to: query.to ? endOfDay(new Date(`${query.to}T00:00:00`)) : endOfMonth(now),
  };
}

export function computeShare(amount: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Number(divideHalfUp(BigInt(amount) * 1000n, BigInt(total))) / 10;
}

export async function getPeriodTotals(
  userId: string,
  baseCurrency: Currency,
  period: Period,
): Promise<TransactionTotals> {
  const totals = await transactionRepository.sumBaseAmountsByType(userId, {
    from: period.from,
    to: period.to,
  });

  return summarise(totals, baseCurrency);
}

export async function getSummary(
  userId: string,
  options: BalanceOptions,
  period: Period,
): Promise<AnalyticsSummary> {
  const [{ totalBalance }, totals] = await Promise.all([
    listWallets(userId, options),
    getPeriodTotals(userId, options.baseCurrency, period),
  ]);

  return { period, totalBalance, totals };
}

function toShares(
  totals: readonly CategoryTotal[],
  names: Map<string, { name: string; color: string }>,
  baseCurrency: Currency,
): CategoryShare[] {
  const spent = totals.filter((total) => total.total > 0);
  const overall = spent.reduce((sum, total) => sum + total.total, 0);

  return spent
    .flatMap((total) => {
      const category = names.get(total.categoryId);

      return category
        ? [
            {
              categoryId: total.categoryId,
              name: category.name,
              color: category.color,
              amount: total.total,
              share: computeShare(total.total, overall),
              currency: baseCurrency,
            },
          ]
        : [];
    })
    .sort((left, right) => right.amount - left.amount);
}

export async function getCategoryBreakdown(
  userId: string,
  baseCurrency: Currency,
  period: Period,
): Promise<CategoryShare[]> {
  const [totals, categories] = await Promise.all([
    transactionRepository.sumBaseAmountsByCategory(userId, {
      from: period.from,
      to: period.to,
      types: ["EXPENSE"],
    }),
    categoryRepository.listByUser(userId, { kind: "EXPENSE" }),
  ]);

  return toShares(
    totals,
    new Map(
      categories.map((category) => [
        category.id,
        { name: category.name, color: category.color },
      ]),
    ),
    baseCurrency,
  );
}

export async function getMonthlyTrend(
  userId: string,
  baseCurrency: Currency,
  now: Date,
  months: number = TREND_MONTHS,
): Promise<MonthlyPoint[]> {
  const starts = Array.from({ length: months }, (_, index) =>
    startOfMonth(subMonths(now, months - 1 - index)),
  );

  return Promise.all(
    starts.map(async (start) => {
      const totals = await transactionRepository.sumBaseAmountsByType(userId, {
        from: start,
        to: endOfMonth(start),
      });
      const { income, expense } = summarise(totals, baseCurrency);

      return { month: format(start, "yyyy-MM"), income, expense, currency: baseCurrency };
    }),
  );
}
