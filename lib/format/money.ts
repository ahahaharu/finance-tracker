import type { Currency } from "@/lib/generated/prisma/enums";

export function formatMoney(
  minor: number,
  currency: Currency,
  locale: string,
): string {
  const negative = minor < 0;
  const digits = String(Math.abs(minor)).padStart(3, "0");
  const decimal = `${digits.slice(0, -2)}.${digits.slice(-2)}` as `${number}`;

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(decimal);

  return negative ? `−${formatted}` : formatted;
}

const inputPattern = /^(-)?(\d+)(?:[.,](\d{1,2}))?$/;

export function parseMoney(value: string): number | null {
  const normalized = value.replace(/\s/g, "").replace(/^−/, "-");
  const match = inputPattern.exec(normalized);

  if (!match) {
    return null;
  }

  const [, sign, whole, fraction = ""] = match;
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

  if (!Number.isSafeInteger(minor)) {
    return null;
  }

  return sign ? -minor : minor;
}

export function toMoneyInput(minor: number): string {
  const digits = String(Math.abs(minor)).padStart(3, "0");
  const value = `${digits.slice(0, -2)}.${digits.slice(-2)}`;

  return minor < 0 ? `-${value}` : value;
}
