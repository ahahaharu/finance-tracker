import type { FormState } from "@/lib/forms/state";

export const budgetFormErrorCodes = [
  "VALIDATION_FAILED",
  "BUDGET_EXISTS",
  "CATEGORY_KIND_MISMATCH",
  "NOT_FOUND",
] as const;

export type BudgetFormErrorCode = (typeof budgetFormErrorCodes)[number];

export type BudgetFormState = FormState<BudgetFormErrorCode>;
