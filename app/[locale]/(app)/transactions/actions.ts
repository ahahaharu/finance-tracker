"use server";

import { revalidatePath } from "next/cache";
import type { Locale } from "next-intl";
import type { ZodError } from "zod";

import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import { type ErrorCode, isDomainError } from "@/lib/errors";
import { parseMoney } from "@/lib/format/money";
import { formFailure } from "@/lib/forms/failure";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "@/lib/schemas/transaction";
import {
  createTransaction,
  deleteTransaction,
  transactionContext,
  updateTransaction,
} from "@/lib/services/transaction";

import {
  type TransactionFormErrorCode,
  transactionFormErrorCodes,
  type TransactionFormState,
} from "./failure";

function isFormErrorCode(code: ErrorCode): code is TransactionFormErrorCode {
  return (transactionFormErrorCodes as readonly ErrorCode[]).includes(code);
}

function invalidFields(error: ZodError): string[] {
  return [...new Set(error.issues.map((issue) => String(issue.path[0])))];
}

function toFormState(error: unknown): TransactionFormState {
  if (isDomainError(error) && isFormErrorCode(error.code)) {
    return {
      code: error.code,
      invalid:
        error.code === "FUTURE_DATE"
          ? ["occurredAt"]
          : error.code === "CATEGORY_KIND_MISMATCH"
            ? ["categoryId"]
            : undefined,
    };
  }

  throw error;
}

function readFields(formData: FormData) {
  const amount = parseMoney(String(formData.get("amount") ?? ""));
  const occurredAt = String(formData.get("occurredAt") ?? "");

  return {
    amount,
    fields: {
      type: formData.get("type"),
      amount: amount ?? undefined,
      walletId: formData.get("walletId"),
      categoryId: formData.get("categoryId"),
      occurredAt: occurredAt === "" ? undefined : new Date(occurredAt),
      note: formData.get("note") ?? "",
    },
  };
}

export async function createTransactionAction(
  locale: Locale,
  _state: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const user = await requireUser();
  const { amount, fields } = readFields(formData);

  if (amount === null) {
    return formFailure(locale, formData, {
      code: "VALIDATION_FAILED",
      invalid: ["amount"],
    });
  }

  const input = createTransactionSchema.safeParse(fields);

  if (!input.success) {
    return formFailure(locale, formData, {
      code: "VALIDATION_FAILED",
      invalid: invalidFields(input.error),
    });
  }

  try {
    await createTransaction(user.id, input.data, transactionContext(user));
  } catch (error) {
    return formFailure(locale, formData, toFormState(error));
  }

  revalidatePath(`/${locale}/transactions`);

  return redirect({ href: "/transactions", locale });
}

export async function updateTransactionAction(
  locale: Locale,
  transactionId: string,
  _state: TransactionFormState,
  formData: FormData,
): Promise<TransactionFormState> {
  const user = await requireUser();
  const { amount, fields } = readFields(formData);

  if (amount === null) {
    return formFailure(locale, formData, {
      code: "VALIDATION_FAILED",
      invalid: ["amount"],
    });
  }

  const input = updateTransactionSchema.safeParse(fields);

  if (!input.success) {
    return formFailure(locale, formData, {
      code: "VALIDATION_FAILED",
      invalid: invalidFields(input.error),
    });
  }

  try {
    await updateTransaction(
      user.id,
      transactionId,
      input.data,
      transactionContext(user),
    );
  } catch (error) {
    return formFailure(locale, formData, toFormState(error));
  }

  revalidatePath(`/${locale}/transactions`);

  return redirect({ href: "/transactions", locale });
}

export async function deleteTransactionAction(
  locale: Locale,
  formData: FormData,
): Promise<never> {
  const user = await requireUser();
  const transactionId = String(formData.get("transactionId") ?? "");

  let failure: TransactionFormState | null = null;

  try {
    await deleteTransaction(user.id, transactionId);
  } catch (error) {
    failure = toFormState(error);
  }

  revalidatePath(`/${locale}/transactions`);

  return redirect({
    href: {
      pathname: "/transactions",
      query: failure ? { error: failure.code as string, transactionId } : {},
    },
    locale,
  });
}
