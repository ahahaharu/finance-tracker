"use server";

import { revalidatePath } from "next/cache";
import type { Locale } from "next-intl";
import type { ZodError } from "zod";

import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import { type ErrorCode, isDomainError } from "@/lib/errors";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "@/lib/schemas/profile";
import { changePassword, updateProfile } from "@/lib/services/profile";

const formErrorCodes = [
  "VALIDATION_FAILED",
  "INVALID_CREDENTIALS",
  "RATE_NOT_AVAILABLE",
  "NOT_FOUND",
] as const;

export type SettingsErrorCode = (typeof formErrorCodes)[number];

export type SettingsFormState = {
  code?: SettingsErrorCode;
  invalid?: string[];
  saved?: boolean;
};

function isFormErrorCode(code: ErrorCode): code is SettingsErrorCode {
  return (formErrorCodes as readonly ErrorCode[]).includes(code);
}

function invalidFields(error: ZodError): string[] {
  return [...new Set(error.issues.map((issue) => String(issue.path[0])))];
}

function toFormState(error: unknown): SettingsFormState {
  if (isDomainError(error) && isFormErrorCode(error.code)) {
    return { code: error.code };
  }

  throw error;
}

export async function updateProfileAction(
  locale: Locale,
  _state: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireUser();
  const input = updateProfileSchema.safeParse({
    name: formData.get("name"),
    locale: formData.get("locale"),
  });

  if (!input.success) {
    return { code: "VALIDATION_FAILED", invalid: invalidFields(input.error) };
  }

  try {
    await updateProfile(user.id, input.data);
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/${locale}`, "layout");

  if (input.data.locale && input.data.locale !== locale) {
    return redirect({ href: "/settings", locale: input.data.locale });
  }

  return { saved: true };
}

export async function changeCurrencyAction(
  locale: Locale,
  _state: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireUser();
  const input = updateProfileSchema.safeParse({
    baseCurrency: formData.get("baseCurrency"),
  });

  if (!input.success) {
    return { code: "VALIDATION_FAILED", invalid: invalidFields(input.error) };
  }

  try {
    await updateProfile(user.id, input.data);
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/${locale}`, "layout");

  return { saved: true };
}

export async function changePasswordAction(
  _locale: Locale,
  _state: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await requireUser();
  const input = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });

  if (!input.success) {
    return { code: "VALIDATION_FAILED", invalid: invalidFields(input.error) };
  }

  try {
    await changePassword(user.id, input.data);
  } catch (error) {
    return toFormState(error);
  }

  return { saved: true };
}
