import type { SearchParams } from "@/lib/forms/state";

export const transactionFormErrorCodes = [
  "VALIDATION_FAILED",
  "CATEGORY_KIND_MISMATCH",
  "FUTURE_DATE",
  "RATE_NOT_AVAILABLE",
  "NOT_FOUND",
] as const;

export type TransactionFormErrorCode =
  (typeof transactionFormErrorCodes)[number];

export type TransactionFormState = {
  code?: TransactionFormErrorCode;
  invalid?: string[];
};

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function deleteFailed(query: SearchParams): boolean {
  return single(query.error) === "NOT_FOUND";
}
