import {
  WalletHasTransactionsError,
  WalletNameTakenError,
} from "@/lib/errors";
import type { Currency, TransactionType, WalletType } from "@/lib/generated/prisma/enums";
import type { Wallet } from "@/lib/generated/prisma/client";
import {
  type WalletMovement,
  walletRepository,
} from "@/lib/repositories/wallet";
import type { CollectionQuery } from "@/lib/schemas/collection";
import type {
  CreateWalletInput,
  UpdateWalletInput,
} from "@/lib/schemas/wallet";
import { assertOwnership } from "@/lib/services/access";
import {
  applyRate,
  findConversion,
  parseRate,
} from "@/lib/services/exchange-rate";

export type WalletView = {
  id: string;
  name: string;
  type: WalletType;
  currency: Currency;
  initialBalance: number;
  currentBalance: number;
  baseBalance: number | null;
  baseCurrency: Currency;
  createdAt: Date;
};

export type TotalBalance = {
  amount: number;
  currency: Currency;
  complete: boolean;
};

export type WalletList = {
  items: WalletView[];
  total: number;
  totalBalance: TotalBalance;
};

export type BalanceOptions = {
  baseCurrency: Currency;
  on: Date;
};

export function balanceOptions(user: {
  baseCurrency: Currency;
}): BalanceOptions {
  return { baseCurrency: user.baseCurrency, on: new Date() };
}

const incoming: readonly TransactionType[] = ["INCOME", "TRANSFER_IN"];

export function computeBalance(
  initialBalance: number,
  movements: readonly WalletMovement[],
): number {
  return movements.reduce(
    (balance, movement) =>
      incoming.includes(movement.type)
        ? balance + movement.total
        : balance - movement.total,
    initialBalance,
  );
}

function toView(
  wallet: Wallet,
  movements: readonly WalletMovement[],
  options: BalanceOptions,
  rate: string | null,
): WalletView {
  const currentBalance = computeBalance(wallet.initialBalance, movements);

  return {
    id: wallet.id,
    name: wallet.name,
    type: wallet.type,
    currency: wallet.currency,
    initialBalance: wallet.initialBalance,
    currentBalance,
    baseBalance: rate === null ? null : applyRate(currentBalance, parseRate(rate)),
    baseCurrency: options.baseCurrency,
    createdAt: wallet.createdAt,
  };
}

async function ratesFor(
  currencies: readonly Currency[],
  options: BalanceOptions,
): Promise<Map<Currency, string | null>> {
  const distinct = [...new Set(currencies)];
  const conversions = await Promise.all(
    distinct.map((currency) =>
      findConversion({
        from: currency,
        to: options.baseCurrency,
        on: options.on,
      }),
    ),
  );

  return new Map(
    distinct.map((currency, index) => [
      currency,
      conversions[index]?.rate ?? null,
    ]),
  );
}

function sumBaseBalances(
  items: readonly WalletView[],
  baseCurrency: Currency,
): TotalBalance {
  return {
    amount: items.reduce((total, wallet) => total + (wallet.baseBalance ?? 0), 0),
    currency: baseCurrency,
    complete: items.every((wallet) => wallet.baseBalance !== null),
  };
}

async function assertNameIsFree(
  userId: string,
  name: string,
  currentId?: string,
): Promise<void> {
  const existing = await walletRepository.findByName(userId, name);

  if (existing && existing.id !== currentId) {
    throw new WalletNameTakenError();
  }
}

async function ownedWallet(userId: string, walletId: string): Promise<Wallet> {
  const wallet = await walletRepository.findById(walletId);

  assertOwnership(wallet, userId);

  return wallet;
}

export async function listWallets(
  userId: string,
  options: BalanceOptions,
  page?: CollectionQuery,
): Promise<WalletList> {
  const [wallets, total] = await Promise.all([
    walletRepository.listByUser(
      userId,
      page
        ? { skip: (page.page - 1) * page.pageSize, take: page.pageSize }
        : undefined,
    ),
    walletRepository.countByUser(userId),
  ]);

  const [movements, rates] = await Promise.all([
    walletRepository.sumAmountsByType(
      userId,
      wallets.map((wallet) => wallet.id),
    ),
    ratesFor(
      wallets.map((wallet) => wallet.currency),
      options,
    ),
  ]);

  const items = wallets.map((wallet) =>
    toView(
      wallet,
      movements.filter((movement) => movement.walletId === wallet.id),
      options,
      rates.get(wallet.currency) ?? null,
    ),
  );

  return {
    items,
    total,
    totalBalance: sumBaseBalances(items, options.baseCurrency),
  };
}

export async function getWallet(
  userId: string,
  walletId: string,
  options: BalanceOptions,
): Promise<WalletView> {
  const wallet = await ownedWallet(userId, walletId);
  const [movements, rates] = await Promise.all([
    walletRepository.sumAmountsByType(userId, [wallet.id]),
    ratesFor([wallet.currency], options),
  ]);

  return toView(
    wallet,
    movements,
    options,
    rates.get(wallet.currency) ?? null,
  );
}

export async function createWallet(
  userId: string,
  input: CreateWalletInput,
  options: BalanceOptions,
): Promise<WalletView> {
  await assertNameIsFree(userId, input.name);

  const created = await walletRepository.create({ userId, ...input });
  const rates = await ratesFor([created.currency], options);

  return toView(created, [], options, rates.get(created.currency) ?? null);
}

export async function updateWallet(
  userId: string,
  walletId: string,
  input: UpdateWalletInput,
  options: BalanceOptions,
): Promise<WalletView> {
  const wallet = await ownedWallet(userId, walletId);

  const changes = {
    name: input.name ?? wallet.name,
    type: input.type ?? wallet.type,
    initialBalance: input.initialBalance ?? wallet.initialBalance,
  };

  if (changes.name !== wallet.name) {
    await assertNameIsFree(userId, changes.name, wallet.id);
  }

  const updated = await walletRepository.update(wallet.id, changes);
  const [movements, rates] = await Promise.all([
    walletRepository.sumAmountsByType(userId, [wallet.id]),
    ratesFor([updated.currency], options),
  ]);

  return toView(
    updated,
    movements,
    options,
    rates.get(updated.currency) ?? null,
  );
}

export async function deleteWallet(
  userId: string,
  walletId: string,
): Promise<void> {
  const wallet = await ownedWallet(userId, walletId);
  const transactionCount = await walletRepository.countTransactions(wallet.id);

  if (transactionCount > 0) {
    throw new WalletHasTransactionsError(transactionCount);
  }

  await walletRepository.remove(wallet.id);
}
