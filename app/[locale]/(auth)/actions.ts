"use server";

import { headers } from "next/headers";
import type { Locale } from "next-intl";
import { AuthError, CredentialsSignin } from "next-auth";
import type { ZodError } from "zod";

import { redirect } from "@/i18n/navigation";
import { signIn } from "@/lib/auth";
import { type ErrorCode, isDomainError, RateLimitedError } from "@/lib/errors";
import { formFailure } from "@/lib/forms/failure";
import { credentialsSchema, registerSchema } from "@/lib/schemas/auth";
import { registerUser } from "@/lib/services/auth";
import {
  attemptKey,
  clientAddress,
  consumeAttempt,
} from "@/lib/services/rate-limit";

import {
  type AuthFormErrorCode,
  authFormErrorCodes,
  type AuthFormState,
} from "./failure";

function isFormErrorCode(code: ErrorCode): code is AuthFormErrorCode {
  return (authFormErrorCodes as readonly ErrorCode[]).includes(code);
}

function invalidFields(error: ZodError): string[] {
  return [...new Set(error.issues.map((issue) => String(issue.path[0])))];
}

async function withinLimit(scope: "login" | "register"): Promise<boolean> {
  try {
    consumeAttempt(attemptKey(scope, clientAddress(await headers())));

    return true;
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return false;
    }

    throw error;
  }
}

async function signInWithCredentials(
  email: string,
  password: string,
): Promise<AuthFormErrorCode | null> {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return null;
  } catch (error) {
    if (error instanceof CredentialsSignin && error.code === "ACCOUNT_BLOCKED") {
      return "ACCOUNT_BLOCKED";
    }

    if (error instanceof AuthError) {
      return "INVALID_CREDENTIALS";
    }

    throw error;
  }
}

export async function loginAction(
  locale: Locale,
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!(await withinLimit("login"))) {
    return formFailure(locale, formData, { code: "RATE_LIMITED" });
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return formFailure(locale, formData, {
      code: "VALIDATION_FAILED",
      invalid: invalidFields(parsed.error),
    });
  }

  const failure = await signInWithCredentials(
    parsed.data.email,
    parsed.data.password,
  );

  if (failure) {
    return formFailure(locale, formData, { code: failure });
  }

  return redirect({ href: "/", locale });
}

export async function registerAction(
  locale: Locale,
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!(await withinLimit("register"))) {
    return formFailure(locale, formData, { code: "RATE_LIMITED" });
  }

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    baseCurrency: formData.get("baseCurrency"),
  });

  if (!parsed.success) {
    return formFailure(locale, formData, {
      code: "VALIDATION_FAILED",
      invalid: invalidFields(parsed.error),
    });
  }

  try {
    await registerUser(parsed.data, locale);
  } catch (error) {
    if (isDomainError(error) && isFormErrorCode(error.code)) {
      return formFailure(locale, formData, {
        code: error.code,
        invalid: ["email"],
      });
    }

    throw error;
  }

  const failure = await signInWithCredentials(
    parsed.data.email,
    parsed.data.password,
  );

  return redirect({ href: failure ? "/login" : "/", locale });
}
