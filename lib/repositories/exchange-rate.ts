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

export const exchangeRateRepository: ExchangeRateRepository = {
  findLatestOnOrBefore(fromCurrency, date) {
    return prisma.exchangeRate.findFirst({
      where: { fromCurrency, toCurrency: "BYN", date: { lte: date } },
      orderBy: { date: "desc" },
    });
  },

  listLatestOnOrBefore(date) {
    return prisma.exchangeRate.findMany({
      where: { toCurrency: "BYN", date: { lte: date } },
      orderBy: { date: "desc" },
      distinct: ["fromCurrency"],
    });
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
