import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/db";
import type { ExchangeRate } from "@/lib/generated/prisma/client";
import type { Currency } from "@/lib/generated/prisma/enums";

export type NewExchangeRate = {
  date: Date;
  fromCurrency: Currency;
  rate: string;
};

export type ExchangeRateRepository = {
  findLatestOnOrBefore(
    fromCurrency: Currency,
    date: Date,
  ): Promise<ExchangeRate | null>;
  listLatestOnOrBefore(date: Date): Promise<ExchangeRate[]>;
  saveMany(rates: readonly NewExchangeRate[]): Promise<number>;
};

export const RATES_CACHE_TAG = "exchange-rates";

const CACHE_SECONDS = 60 * 60;

const cachedLatestOnOrBefore = unstable_cache(
  (fromCurrency: Currency, date: string) =>
    prisma.exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency: "BYN",
        date: { lte: new Date(date) },
      },
      orderBy: { date: "desc" },
    }),
  ["exchange-rate-latest"],
  { tags: [RATES_CACHE_TAG], revalidate: CACHE_SECONDS },
);

const cachedListLatestOnOrBefore = unstable_cache(
  (date: string) =>
    prisma.exchangeRate.findMany({
      where: { toCurrency: "BYN", date: { lte: new Date(date) } },
      orderBy: { date: "desc" },
      distinct: ["fromCurrency"],
    }),
  ["exchange-rate-list"],
  { tags: [RATES_CACHE_TAG], revalidate: CACHE_SECONDS },
);

export const exchangeRateRepository: ExchangeRateRepository = {
  findLatestOnOrBefore(fromCurrency, date) {
    return cachedLatestOnOrBefore(fromCurrency, date.toISOString());
  },

  listLatestOnOrBefore(date) {
    return cachedListLatestOnOrBefore(date.toISOString());
  },

  async saveMany(rates) {
    if (rates.length === 0) {
      return 0;
    }

    const written = await prisma.$transaction(
      rates.map(({ date, fromCurrency, rate }) =>
        prisma.exchangeRate.upsert({
          where: {
            date_fromCurrency_toCurrency: {
              date,
              fromCurrency,
              toCurrency: "BYN",
            },
          },
          create: { date, fromCurrency, toCurrency: "BYN", rate },
          update: { rate, fetchedAt: new Date() },
        }),
      ),
    );

    return written.length;
  },
};
