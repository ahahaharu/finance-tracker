"use server";

import { revalidatePath } from "next/cache";
import type { Locale } from "next-intl";
import type { ZodError } from "zod";

import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import { type ErrorCode, isDomainError } from "@/lib/errors";
import { parseMoney } from "@/lib/format/money";
import { createWalletSchema, updateWalletSchema } from "@/lib/schemas/wallet";
import {
  createWallet,
  deleteWallet,
  updateWallet,
} from "@/lib/services/wallet";

const formErrorCodes = [
  "VALIDATION_FAILED",
  "WALLET_NAME_TAKEN",
  "WALLET_HAS_TRANSACTIONS",
  "NOT_FOUND",
] as const;

export type WalletFormErrorCode = (typeof formErrorCodes)[number];

export type WalletFormState = {
  code?: WalletFormErrorCode;
  invalid?: string[];
  transactionCount?: number;
};

function isFormErrorCode(code: ErrorCode): code is WalletFormErrorCode {
  return (formErrorCodes as readonly ErrorCode[]).includes(code);
}

function invalidFields(error: ZodError): string[] {
  return [...new Set(error.issues.map((issue) => String(issue.path[0])))];
}

function toFormState(error: unknown): WalletFormState {
  if (isDomainError(error) && isFormErrorCode(error.code)) {
    return {
      code: error.code,
      invalid: error.code === "WALLET_NAME_TAKEN" ? ["name"] : undefined,
      transactionCount:
        typeof error.details?.transactionCount === "number"
          ? error.details.transactionCount
          : undefined,
    };
  }

  throw error;
}

function readBalance(formData: FormData): number | null {
  const raw = String(formData.get("initialBalance") ?? "").trim();

  return raw === "" ? 0 : parseMoney(raw);
}

export async function createWalletAction(
  locale: Locale,
  _state: WalletFormState,
  formData: FormData,
): Promise<WalletFormState> {
  const user = await requireUser();
  const initialBalance = readBalance(formData);

  if (initialBalance === null) {
    return { code: "VALIDATION_FAILED", invalid: ["initialBalance"] };
  }

  const input = createWalletSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    currency: formData.get("currency"),
    initialBalance,
  });

  if (!input.success) {
    return {
      code: "VALIDATION_FAILED",
      invalid: invalidFields(input.error),
    };
  }

  try {
    await createWallet(user.id, input.data);
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/${locale}/wallets`);

  return redirect({ href: "/wallets", locale });
}

export async function updateWalletAction(
  locale: Locale,
  walletId: string,
  _state: WalletFormState,
  formData: FormData,
): Promise<WalletFormState> {
  const user = await requireUser();
  const initialBalance = readBalance(formData);

  if (initialBalance === null) {
    return { code: "VALIDATION_FAILED", invalid: ["initialBalance"] };
  }

  const input = updateWalletSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    initialBalance,
  });

  if (!input.success) {
    return {
      code: "VALIDATION_FAILED",
      invalid: invalidFields(input.error),
    };
  }

  try {
    await updateWallet(user.id, walletId, input.data);
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/${locale}/wallets`);

  return redirect({ href: "/wallets", locale });
}

export async function deleteWalletAction(
  locale: Locale,
  walletId: string,
): Promise<WalletFormState> {
  const user = await requireUser();

  try {
    await deleteWallet(user.id, walletId);
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/${locale}/wallets`);

  return {};
}
