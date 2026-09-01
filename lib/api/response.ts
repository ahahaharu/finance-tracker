import { NextResponse } from "next/server";
import type { ZodError } from "zod";

import { type ErrorCode, isDomainError } from "@/lib/errors";
import { type CollectionMeta } from "@/lib/schemas/collection";

const statusByCode: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  WALLET_NAME_TAKEN: 409,
  CATEGORY_NAME_TAKEN: 409,
  WALLET_HAS_TRANSACTIONS: 409,
  CATEGORY_HAS_TRANSACTIONS: 409,
  BUDGET_EXISTS: 409,
  CATEGORY_KIND_MISMATCH: 422,
  FUTURE_DATE: 422,
  SAME_WALLET_TRANSFER: 422,
  RATE_NOT_AVAILABLE: 422,
  ACCOUNT_BLOCKED: 403,
  INVALID_CREDENTIALS: 401,
  SELF_MODIFICATION_FORBIDDEN: 403,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export function resource<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function created<T>(data: T, location: string): NextResponse {
  return NextResponse.json(data, {
    status: 201,
    headers: { Location: location },
  });
}

export function collection<T>(
  data: T[],
  meta: CollectionMeta & Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ data, meta });
}

function retryAfter(
  code: ErrorCode,
  details?: Record<string, unknown>,
): HeadersInit | undefined {
  if (code !== "RATE_LIMITED" || typeof details?.retryAfterSeconds !== "number") {
    return undefined;
  }

  return { "Retry-After": String(details.retryAfterSeconds) };
}

export function failure(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status: statusByCode[code], headers: retryAfter(code, details) },
  );
}

export function validationFailure(error: ZodError): NextResponse {
  return failure("VALIDATION_FAILED", "Request payload failed validation", {
    fields: error.issues.map((issue) => ({
      path: issue.path.join("."),
      code: issue.code,
    })),
  });
}

export function malformedBody(): NextResponse {
  return NextResponse.json(
    { error: { code: "VALIDATION_FAILED", message: "Body is not valid JSON" } },
    { status: 400 },
  );
}

export async function readJson(
  request: Request,
): Promise<{ value: unknown } | null> {
  try {
    return { value: await request.json() };
  } catch {
    return null;
  }
}

export function toErrorResponse(error: unknown): NextResponse {
  if (isDomainError(error)) {
    return failure(error.code, error.message, error.details);
  }

  console.error(error);

  return failure("INTERNAL_ERROR", "Unexpected error");
}

export async function handle(
  run: () => Promise<Response>,
): Promise<Response> {
  try {
    return await run();
  } catch (error) {
    return toErrorResponse(error);
  }
}
