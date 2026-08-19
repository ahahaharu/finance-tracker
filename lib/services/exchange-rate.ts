import { format } from "date-fns";
import { z } from "zod";

import { RateNotAvailableError } from "@/lib/errors";
import type { Currency } from "@/lib/generated/prisma/enums";
import {
  type NewExchangeRate,
  exchangeRateRepository,
} from "@/lib/repositories/exchange-rate";

export const RATE_PRECISION = 8;

const RATE_UNIT = 10n ** BigInt(RATE_PRECISION);
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const BASE_CURRENCY: Currency = "BYN";
const trackedCurrencies: readonly Currency[] = ["USD", "EUR"];

const ratePattern = /^(-)?(\d+)(?:\.(\d+))?$/;

export type Conversion = {
  rate: string;
  rateDate: Date;
};

export type ConvertedAmount = Conversion & {
  amount: number;
};

export type RateView = {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: string;
  date: Date;
};

export function dateOnly(value: Date): Date {
  return new Date(`${format(value, "yyyy-MM-dd")}T00:00:00.000Z`);
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseRate(value: string): bigint {
  const match = ratePattern.exec(value.trim());

  if (!match) {
    throw new TypeError(`Rate is not a decimal number: ${value}`);
  }

  const [, sign, whole, fraction = ""] = match;
  const digits = fraction.slice(0, RATE_PRECISION).padEnd(RATE_PRECISION, "0");
  const scaled = BigInt(whole) * RATE_UNIT + BigInt(digits);

  return sign ? -scaled : scaled;
}

export function formatRate(scaled: bigint): string {
  const negative = scaled < 0n;
  const digits = (negative ? -scaled : scaled)
    .toString()
    .padStart(RATE_PRECISION + 1, "0");
  const value = `${digits.slice(0, -RATE_PRECISION)}.${digits.slice(-RATE_PRECISION)}`;

  return negative ? `-${value}` : value;
}

export function divideHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) {
    throw new RangeError("Division by zero");
  }

  const negative = numerator < 0n !== denominator < 0n;
  const left = numerator < 0n ? -numerator : numerator;
  const right = denominator < 0n ? -denominator : denominator;
  const quotient = left / right;
  const rounded = (left % right) * 2n >= right ? quotient + 1n : quotient;

  return negative ? -rounded : rounded;
}

export function crossRate(from: bigint, to: bigint): bigint {
  return divideHalfUp(from * RATE_UNIT, to);
}

export function applyRate(amount: number, rate: bigint): number {
  return Number(divideHalfUp(BigInt(amount) * rate, RATE_UNIT));
}

async function rateToBase(
  currency: Currency,
  on: Date,
): Promise<{ scaled: bigint; date: Date } | null> {
  if (currency === BASE_CURRENCY) {
    return { scaled: RATE_UNIT, date: on };
  }

  const stored = await exchangeRateRepository.findLatestOnOrBefore(
    currency,
    on,
  );

  return stored
    ? { scaled: parseRate(stored.rate.toFixed(RATE_PRECISION)), date: stored.date }
    : null;
}

export async function findConversion({
  from,
  to,
  on,
}: {
  from: Currency;
  to: Currency;
  on: Date;
}): Promise<Conversion | null> {
  const date = dateOnly(on);

  if (from === to) {
    return { rate: formatRate(RATE_UNIT), rateDate: date };
  }

  const [source, target] = await Promise.all([
    rateToBase(from, date),
    rateToBase(to, date),
  ]);

  if (!source || !target) {
    return null;
  }

  return {
    rate: formatRate(crossRate(source.scaled, target.scaled)),
    rateDate: source.date < target.date ? source.date : target.date,
  };
}

export async function convertAmount({
  amount,
  from,
  to,
  on,
}: {
  amount: number;
  from: Currency;
  to: Currency;
  on: Date;
}): Promise<ConvertedAmount> {
  const conversion = await findConversion({ from, to, on });

  if (!conversion) {
    throw new RateNotAvailableError();
  }

  return {
    ...conversion,
    amount: applyRate(amount, parseRate(conversion.rate)),
  };
}

export async function listRates(on: Date): Promise<RateView[]> {
  const stored = await exchangeRateRepository.listLatestOnOrBefore(
    dateOnly(on),
  );

  return stored.map((rate) => ({
    fromCurrency: rate.fromCurrency,
    toCurrency: rate.toCurrency,
    rate: rate.rate.toFixed(RATE_PRECISION),
    date: rate.date,
  }));
}

const nbrbRateSchema = z.object({
  Cur_Abbreviation: z.string(),
  Cur_OfficialRate: z.number().positive(),
  Cur_Scale: z.number().int().positive(),
});

const nbrbResponseSchema = z.array(nbrbRateSchema);

function endpoint(date: Date): string {
  const base = process.env.NBRB_API_URL ?? "https://api.nbrb.by/exrates";

  return `${base}/rates?ondate=${isoDate(date)}&periodicity=0`;
}

async function requestRates(date: Date): Promise<Response> {
  try {
    return await fetch(endpoint(date), {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    throw new Error(
      `National Bank at ${endpoint(date)} is unreachable: check the network or NBRB_API_URL`,
      { cause: error },
    );
  }
}

async function fetchRatesForDate(date: Date): Promise<NewExchangeRate[]> {
  const response = await requestRates(date);

  if (!response.ok) {
    throw new Error(
      `National Bank responded with ${response.status} for ${isoDate(date)}`,
    );
  }

  const published = nbrbResponseSchema.parse(await response.json());

  return published
    .filter((rate) =>
      trackedCurrencies.includes(rate.Cur_Abbreviation as Currency),
    )
    .map((rate) => ({
      date,
      fromCurrency: rate.Cur_Abbreviation as Currency,
      rate: formatRate(
        divideHalfUp(
          parseRate(rate.Cur_OfficialRate.toFixed(RATE_PRECISION)),
          BigInt(rate.Cur_Scale),
        ),
      ),
    }));
}

export async function refreshRates({
  from,
  to,
}: {
  from: Date;
  to: Date;
}): Promise<{ dates: number; rates: number }> {
  let cursor = dateOnly(from);
  const last = dateOnly(to);
  let dates = 0;
  let rates = 0;

  while (cursor <= last) {
    rates += await exchangeRateRepository.saveMany(
      await fetchRatesForDate(cursor),
    );
    dates += 1;
    cursor = new Date(cursor.getTime() + DAY_IN_MS);
  }

  return { dates, rates };
}
