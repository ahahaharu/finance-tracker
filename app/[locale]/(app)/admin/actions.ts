"use server";

import { revalidatePath } from "next/cache";
import type { Locale } from "next-intl";

import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import { invalidate, RATES_TAG } from "@/lib/cache/tags";
import { type ErrorCode, isDomainError } from "@/lib/errors";
import { updateUserSchema } from "@/lib/schemas/admin";
import { refreshRatesNow, updateAccount } from "@/lib/services/admin";

import { type AccountErrorCode, accountErrorCodes } from "./query";

function isAccountErrorCode(code: ErrorCode): code is AccountErrorCode {
  return (accountErrorCodes as readonly ErrorCode[]).includes(code);
}

function listQuery(formData: FormData): Record<string, string> {
  const q = String(formData.get("q") ?? "");
  const page = String(formData.get("page") ?? "");

  return {
    ...(q ? { q } : {}),
    ...(page && page !== "1" ? { page } : {}),
  };
}

export async function updateAccountAction(
  locale: Locale,
  formData: FormData,
): Promise<never> {
  const actor = await requireUser();
  const userId = String(formData.get("userId") ?? "");
  const role = formData.get("role");
  const isBlocked = formData.get("isBlocked");
  const input = updateUserSchema.safeParse({
    ...(role === null ? {} : { role }),
    ...(isBlocked === null ? {} : { isBlocked: isBlocked === "true" }),
  });

  let failure: AccountErrorCode | null = null;

  if (!input.success) {
    failure = "VALIDATION_FAILED";
  } else {
    try {
      await updateAccount(actor, userId, input.data);
    } catch (error) {
      if (isDomainError(error) && isAccountErrorCode(error.code)) {
        failure = error.code;
      } else {
        throw error;
      }
    }
  }

  revalidatePath(`/${locale}/admin`);

  return redirect({
    href: {
      pathname: "/admin",
      query: {
        ...listQuery(formData),
        ...(failure ? { error: failure, userId } : {}),
      },
    },
    locale,
  });
}

export async function refreshRatesAction(
  locale: Locale,
  formData: FormData,
): Promise<never> {
  const actor = await requireUser();

  let rates: string;

  try {
    rates = String((await refreshRatesNow(actor, new Date())).rates);
    invalidate([RATES_TAG]);
  } catch (error) {
    if (isDomainError(error)) {
      throw error;
    }

    console.error(error);
    rates = "failed";
  }

  revalidatePath(`/${locale}/admin`);

  return redirect({
    href: {
      pathname: "/admin",
      query: { ...listQuery(formData), rates },
    },
    locale,
  });
}
