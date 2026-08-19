import { addMonths, format } from "date-fns";

import { monthRange } from "@/lib/services/budget";

export type SearchParams = Record<string, string | string[] | undefined>;

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export function single(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function readMonth(query: SearchParams): string {
  const month = single(query.month);

  return month && monthPattern.test(month)
    ? month
    : format(new Date(), "yyyy-MM");
}

export function shiftMonth(month: string, offset: number): string {
  return format(addMonths(monthRange(month).from, offset), "yyyy-MM");
}
