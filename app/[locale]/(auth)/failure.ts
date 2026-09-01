export const authFormErrorCodes = [
  "VALIDATION_FAILED",
  "EMAIL_TAKEN",
  "INVALID_CREDENTIALS",
  "ACCOUNT_BLOCKED",
  "RATE_LIMITED",
] as const;

export type AuthFormErrorCode = (typeof authFormErrorCodes)[number];

export type AuthFormState = {
  code?: AuthFormErrorCode;
  invalid?: string[];
};
