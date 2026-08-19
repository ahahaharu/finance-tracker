import type { WalletFormErrorCode } from "./actions";

export type SearchParams = Record<string, string | string[] | undefined>;

export type Failure = {
  code: WalletFormErrorCode;
  walletId: string;
  count: number;
};

const deleteErrorCodes: readonly WalletFormErrorCode[] = [
  "WALLET_HAS_TRANSACTIONS",
  "NOT_FOUND",
];

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function readFailure(query: SearchParams): Failure | null {
  const code = deleteErrorCodes.find((known) => known === single(query.error));
  const walletId = single(query.walletId);

  if (!code || !walletId) {
    return null;
  }

  return { code, walletId, count: Number(single(query.count) ?? 0) };
}
