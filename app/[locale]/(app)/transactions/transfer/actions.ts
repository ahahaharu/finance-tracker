"use server";

import { revalidatePath } from "next/cache";
import type { Locale } from "next-intl";
import type { ZodError } from "zod";

import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import { type ErrorCode, isDomainError } from "@/lib/errors";
import { parseMoney } from "@/lib/format/money";
import { formFailure } from "@/lib/forms/failure";
import { createTransferSchema } from "@/lib/schemas/transfer";
import { transactionContext } from "@/lib/services/transaction";
import { createTransfer, deleteTransfer } from "@/lib/services/transfer";

import {
  type TransferFormErrorCode,
  transferFormErrorCodes,
  type TransferFormState,
} from "./failure";

function isFormErrorCode(code: ErrorCode): code is TransferFormErrorCode {
  return (transferFormErrorCodes as readonly ErrorCode[]).includes(code);
}

function invalidFields(error: ZodError): string[] {
  return [...new Set(error.issues.map((issue) => String(issue.path[0])))];
}

function toFormState(error: unknown): TransferFormState {
  if (isDomainError(error) && isFormErrorCode(error.code)) {
    const fields = error.details?.fields;

    return {
      code: error.code,
      invalid: Array.isArray(fields) ? (fields as string[]) : undefined,
    };
  }

  throw error;
}

export async function createTransferAction(
  locale: Locale,
  _state: TransferFormState,
  formData: FormData,
): Promise<TransferFormState> {
  const user = await requireUser();
  const amountFrom = parseMoney(String(formData.get("amountFrom") ?? ""));
  const rawAmountTo = String(formData.get("amountTo") ?? "").trim();
  const amountTo = rawAmountTo === "" ? undefined : parseMoney(rawAmountTo);
  const occurredAt = String(formData.get("occurredAt") ?? "");

  if (amountFrom === null || amountTo === null) {
    return formFailure(locale, formData, {
      code: "VALIDATION_FAILED",
      invalid: amountFrom === null ? ["amountFrom"] : ["amountTo"],
    });
  }

  const input = createTransferSchema.safeParse({
    fromWalletId: formData.get("fromWalletId"),
    toWalletId: formData.get("toWalletId"),
    amountFrom,
    amountTo,
    occurredAt: occurredAt === "" ? undefined : new Date(occurredAt),
    note: formData.get("note") ?? "",
  });

  if (!input.success) {
    return formFailure(locale, formData, {
      code: "VALIDATION_FAILED",
      invalid: invalidFields(input.error),
    });
  }

  try {
    await createTransfer(user.id, input.data, transactionContext(user));
  } catch (error) {
    return formFailure(locale, formData, toFormState(error));
  }

  revalidatePath(`/${locale}/transactions`);

  return redirect({ href: "/transactions", locale });
}

export async function deleteTransferAction(
  locale: Locale,
  formData: FormData,
): Promise<never> {
  const user = await requireUser();
  const groupId = String(formData.get("groupId") ?? "");

  let failure: TransferFormState | null = null;

  try {
    await deleteTransfer(user.id, groupId);
  } catch (error) {
    failure = toFormState(error);
  }

  revalidatePath(`/${locale}/transactions`);

  return redirect({
    href: {
      pathname: "/transactions",
      query: failure ? { error: failure.code as string } : {},
    },
    locale,
  });
}
