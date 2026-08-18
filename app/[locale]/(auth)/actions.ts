"use server";

import type { Locale } from "next-intl";
import { AuthError } from "next-auth";
import type { ZodError } from "zod";

import { redirect } from "@/i18n/navigation";
import { signIn } from "@/lib/auth";
import { type ErrorCode, isDomainError } from "@/lib/errors";
import { credentialsSchema, registerSchema } from "@/lib/schemas/auth";
import { registerUser } from "@/lib/services/auth";

const formErrorCodes = [
  "VALIDATION_FAILED",
  "EMAIL_TAKEN",
  "INVALID_CREDENTIALS",
] as const;

export type AuthFormErrorCode = (typeof formErrorCodes)[number];

export type AuthFormState = {
  code?: AuthFormErrorCode;
  invalid?: string[];
};

function isFormErrorCode(code: ErrorCode): code is AuthFormErrorCode {
  return (formErrorCodes as readonly ErrorCode[]).includes(code);
}

function invalidFields(error: ZodError): string[] {
  return [...new Set(error.issues.map((issue) => String(issue.path[0])))];
}

async function signInWithCredentials(email: string, password: string) {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return true;
  } catch (error) {
    if (error instanceof AuthError) {
      return false;
    }

    throw error;
  }
}

export async function loginAction(
  locale: Locale,
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      code: "VALIDATION_FAILED",
      invalid: invalidFields(parsed.error),
    };
  }

  if (!(await signInWithCredentials(parsed.data.email, parsed.data.password))) {
    return { code: "INVALID_CREDENTIALS" };
  }

  return redirect({ href: "/", locale });
}

export async function registerAction(
  locale: Locale,
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    baseCurrency: formData.get("baseCurrency"),
  });

  if (!parsed.success) {
    return {
      code: "VALIDATION_FAILED",
      invalid: invalidFields(parsed.error),
    };
  }

  try {
    await registerUser(parsed.data, locale);
  } catch (error) {
    if (isDomainError(error) && isFormErrorCode(error.code)) {
      return { code: error.code, invalid: ["email"] };
    }

    throw error;
  }

  const signedIn = await signInWithCredentials(
    parsed.data.email,
    parsed.data.password,
  );

  return redirect({ href: signedIn ? "/" : "/login", locale });
}
