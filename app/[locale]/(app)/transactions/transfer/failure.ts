export const transferFormErrorCodes = [
  "VALIDATION_FAILED",
  "SAME_WALLET_TRANSFER",
  "FUTURE_DATE",
  "RATE_NOT_AVAILABLE",
  "NOT_FOUND",
] as const;

export type TransferFormErrorCode = (typeof transferFormErrorCodes)[number];

export type TransferFormState = {
  code?: TransferFormErrorCode;
  invalid?: string[];
};
