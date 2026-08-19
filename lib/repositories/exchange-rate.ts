import { unstable_cache } from "next/cache";

import { RATES_TAG } from "@/lib/cache/tags";
import { prisma } from "@/lib/db";
import type { Currency } from "@/lib/generated/prisma/enums";

export const RATE_SCALE = 8;

const CACHE_SECONDS = 60 * 60;

export type NewExchangeRate = {
  date: Date;
  fromCurrency: Currency;
  rate: string;
};

export type StoredRate = {
  date: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: string;
};

export type ExchangeRateRepository = {
  findLatestOnOrBefore(
    fromCurrency: Currency,
    date: Date,
  ): Promise<StoredRate | null>;
  listLatestOnOrBefore(date: Date): Promise<StoredRate[]>;
  saveMany(rates: readonly NewExchangeRate[]): Promise<number>;
};

function toStored(row: {
  date: Date;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: { toFixed(digits: number): string };
}): StoredRate {
  return {
    date: row.date.toISOString(),
    fromCurrency: row.fromCurrency,
    toCurrency: row.toCurrency,
    rate: row.rate.toFixed(RATE_SCALE),
  };
}

const cachedLatestOnOrBefore = unstable_cache(
  async (fromCurrency: Currency, date: string) => {
    const row = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency: "BYN",
        date: { lte: new Date(date) },
      },
      orderBy: { date: "desc" },
    });

    return row ? toStored(row) : null;
  },
  ["exchange-rate-latest"],
  { tags: [RATES_TAG], revalidate: CACHE_SECONDS },
);

const cachedListLatestOnOrBefore = unstable_cache(
  async (date: string) => {
    const rows = await prisma.exchangeRate.findMany({
      where: { toCurrency: "BYN", date: { lte: new Date(date) } },
      orderBy: { date: "desc" },
      distinct: ["fromCurrency"],
    });

    return rows.map(toStored);
  },
  ["exchange-rate-list"],
  { tags: [RATES_TAG], revalidate: CACHE_SECONDS },
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
