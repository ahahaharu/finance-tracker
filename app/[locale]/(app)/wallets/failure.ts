import type { SearchParams } from "@/lib/forms/state";

export const walletFormErrorCodes = [
  "VALIDATION_FAILED",
  "WALLET_NAME_TAKEN",
  "WALLET_HAS_TRANSACTIONS",
  "NOT_FOUND",
] as const;

export type WalletFormErrorCode = (typeof walletFormErrorCodes)[number];

export type WalletFormState = {
  code?: WalletFormErrorCode;
  invalid?: string[];
  transactionCount?: number;
};

export type DeleteFailure = {
  code: WalletFormErrorCode;
  count: number;
};

const deleteErrorCodes: readonly WalletFormErrorCode[] = [
  "WALLET_HAS_TRANSACTIONS",
  "NOT_FOUND",
];

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function readDeleteFailure(query: SearchParams): DeleteFailure | null {
  const code = deleteErrorCodes.find((known) => known === single(query.error));

  if (!code) {
    return null;
  }

  return { code, count: Number(single(query.count) ?? 0) };
}
