"use server";

import { revalidatePath } from "next/cache";
import type { Locale } from "next-intl";
import type { ZodError } from "zod";

import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import { type ErrorCode, isDomainError } from "@/lib/errors";
import { parseMoney } from "@/lib/format/money";
import { formFailure } from "@/lib/forms/failure";
import { createBudgetSchema, updateBudgetSchema } from "@/lib/schemas/budget";
import {
  createBudget,
  deleteBudget,
  updateBudget,
} from "@/lib/services/budget";

import {
  type BudgetFormErrorCode,
  budgetFormErrorCodes,
  type BudgetFormState,
} from "./failure";

function isFormErrorCode(code: ErrorCode): code is BudgetFormErrorCode {
  return (budgetFormErrorCodes as readonly ErrorCode[]).includes(code);
}

function invalidFields(error: ZodError): string[] {
  return [...new Set(error.issues.map((issue) => String(issue.path[0])))];
}

function toFormState(error: unknown): BudgetFormState {
  if (isDomainError(error) && isFormErrorCode(error.code)) {
    return {
      code: error.code,
      invalid: error.code === "BUDGET_EXISTS" ? ["categoryId"] : undefined,
    };
  }

  throw error;
}

export async function createBudgetAction(
  locale: Locale,
  _state: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const user = await requireUser();
  const limitAmount = parseMoney(String(formData.get("limitAmount") ?? ""));

  if (limitAmount === null) {
    return formFailure(locale, formData, {
      code: "VALIDATION_FAILED",
      invalid: ["limitAmount"],
    });
  }

  const input = createBudgetSchema.safeParse({
    categoryId: formData.get("categoryId"),
    limitAmount,
    month: formData.get("month"),
  });

  if (!input.success) {
    return formFailure(locale, formData, {
      code: "VALIDATION_FAILED",
      invalid: invalidFields(input.error),
    });
  }

  try {
    await createBudget(user.id, input.data, user.baseCurrency);
  } catch (error) {
    return formFailure(locale, formData, toFormState(error));
  }

  revalidatePath(`/${locale}/budgets`);

  return redirect({
    href: { pathname: "/budgets", query: { month: input.data.month } },
    locale,
  });
}

export async function updateBudgetAction(
  locale: Locale,
  budgetId: string,
  month: string,
  _state: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const user = await requireUser();
  const limitAmount = parseMoney(String(formData.get("limitAmount") ?? ""));

  if (limitAmount === null) {
    return formFailure(locale, formData, {
      code: "VALIDATION_FAILED",
      invalid: ["limitAmount"],
    });
  }

  const input = updateBudgetSchema.safeParse({ limitAmount });

  if (!input.success) {
    return formFailure(locale, formData, {
      code: "VALIDATION_FAILED",
      invalid: invalidFields(input.error),
    });
  }

  try {
    await updateBudget(user.id, budgetId, input.data);
  } catch (error) {
    return formFailure(locale, formData, toFormState(error));
  }

  revalidatePath(`/${locale}/budgets`);

  return redirect({
    href: { pathname: "/budgets", query: { month } },
    locale,
  });
}

export async function deleteBudgetAction(
  locale: Locale,
  formData: FormData,
): Promise<never> {
  const user = await requireUser();
  const budgetId = String(formData.get("budgetId") ?? "");
  const month = String(formData.get("month") ?? "");

  let failure: BudgetFormState | null = null;

  try {
    await deleteBudget(user.id, budgetId);
  } catch (error) {
    failure = toFormState(error);
  }

  revalidatePath(`/${locale}/budgets`);

  return redirect({
    href: {
      pathname: "/budgets",
      query: {
        ...(month ? { month } : {}),
        ...(failure ? { error: failure.code as string, budgetId } : {}),
      },
    },
    locale,
  });
}
