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

export class AccountBlockedError extends DomainError {
  constructor() {
    super("ACCOUNT_BLOCKED", "Account is blocked");
  }
}

export class UnauthenticatedError extends DomainError {
  constructor() {
    super("UNAUTHENTICATED", "No active session");
  }
}

export class ForbiddenError extends DomainError {
  constructor() {
    super("FORBIDDEN", "Insufficient role for this action");
  }
}

export class WalletNameTakenError extends DomainError {
  constructor() {
    super("WALLET_NAME_TAKEN", "Wallet name is already used");
  }
}

export class WalletHasTransactionsError extends DomainError {
  constructor(transactionCount: number) {
    super("WALLET_HAS_TRANSACTIONS", "Wallet has related transactions", {
      transactionCount,
    });
  }
}

export class CategoryNameTakenError extends DomainError {
  constructor() {
    super("CATEGORY_NAME_TAKEN", "Category name is already used for this kind");
  }
}

export class CategoryHasTransactionsError extends DomainError {
  constructor(transactionCount: number) {
    super("CATEGORY_HAS_TRANSACTIONS", "Category has related transactions", {
      transactionCount,
    });
  }
}

export class NotFoundError extends DomainError {
  constructor() {
    super("NOT_FOUND", "Resource does not exist or belongs to another user");
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
