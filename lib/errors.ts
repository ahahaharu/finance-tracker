export const errorCodes = [
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "EMAIL_TAKEN",
  "WALLET_NAME_TAKEN",
  "CATEGORY_NAME_TAKEN",
  "WALLET_HAS_TRANSACTIONS",
  "CATEGORY_HAS_TRANSACTIONS",
  "BUDGET_EXISTS",
  "CATEGORY_KIND_MISMATCH",
  "FUTURE_DATE",
  "SAME_WALLET_TRANSFER",
  "RATE_NOT_AVAILABLE",
  "ACCOUNT_BLOCKED",
  "INVALID_CREDENTIALS",
  "SELF_MODIFICATION_FORBIDDEN",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.details = details;
  }
}

export class EmailTakenError extends DomainError {
  constructor() {
    super("EMAIL_TAKEN", "Email is already registered");
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super("INVALID_CREDENTIALS", "Email and password do not match");
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
