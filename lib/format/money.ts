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
