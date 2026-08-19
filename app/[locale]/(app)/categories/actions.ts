"use server";

import { revalidatePath } from "next/cache";
import type { Locale } from "next-intl";
import type { ZodError } from "zod";

import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import { type ErrorCode, isDomainError } from "@/lib/errors";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/schemas/category";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/services/category";

const formErrorCodes = [
  "VALIDATION_FAILED",
  "CATEGORY_NAME_TAKEN",
  "CATEGORY_HAS_TRANSACTIONS",
  "NOT_FOUND",
] as const;

export type CategoryFormErrorCode = (typeof formErrorCodes)[number];

export type CategoryFormState = {
  code?: CategoryFormErrorCode;
  invalid?: string[];
  transactionCount?: number;
};

function isFormErrorCode(code: ErrorCode): code is CategoryFormErrorCode {
  return (formErrorCodes as readonly ErrorCode[]).includes(code);
}

function invalidFields(error: ZodError): string[] {
  return [...new Set(error.issues.map((issue) => String(issue.path[0])))];
}

function toFormState(error: unknown): CategoryFormState {
  if (isDomainError(error) && isFormErrorCode(error.code)) {
    return {
      code: error.code,
      invalid: error.code === "CATEGORY_NAME_TAKEN" ? ["name"] : undefined,
      transactionCount:
        typeof error.details?.transactionCount === "number"
          ? error.details.transactionCount
          : undefined,
    };
  }

  throw error;
}

export async function createCategoryAction(
  locale: Locale,
  _state: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const user = await requireUser();
  const input = createCategorySchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    color: formData.get("color"),
  });

  if (!input.success) {
    return { code: "VALIDATION_FAILED", invalid: invalidFields(input.error) };
  }

  try {
    await createCategory(user.id, input.data);
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/${locale}/categories`);

  return redirect({ href: "/categories", locale });
}

export async function updateCategoryAction(
  locale: Locale,
  categoryId: string,
  _state: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const user = await requireUser();
  const input = updateCategorySchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });

  if (!input.success) {
    return { code: "VALIDATION_FAILED", invalid: invalidFields(input.error) };
  }

  try {
    await updateCategory(user.id, categoryId, input.data);
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/${locale}/categories`);

  return redirect({ href: "/categories", locale });
}

export async function deleteCategoryAction(
  locale: Locale,
  formData: FormData,
): Promise<never> {
  const user = await requireUser();
  const categoryId = String(formData.get("categoryId") ?? "");
  const kind = String(formData.get("kind") ?? "");

  let failure: CategoryFormState | null = null;

  try {
    await deleteCategory(user.id, categoryId);
  } catch (error) {
    failure = toFormState(error);
  }

  revalidatePath(`/${locale}/categories`);

  return redirect({
    href: {
      pathname: "/categories",
      query: {
        ...(kind ? { kind } : {}),
        ...(failure
          ? {
              error: failure.code as string,
              categoryId,
              ...(failure.transactionCount === undefined
                ? {}
                : { count: String(failure.transactionCount) }),
            }
          : {}),
      },
    },
    locale,
  });
}
