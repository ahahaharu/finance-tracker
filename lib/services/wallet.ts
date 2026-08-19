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

export type WalletView = {
  id: string;
  name: string;
  type: WalletType;
  currency: Currency;
  initialBalance: number;
  currentBalance: number;
  createdAt: Date;
};

export type WalletList = {
  items: WalletView[];
  total: number;
};

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

function toView(wallet: Wallet, movements: readonly WalletMovement[]): WalletView {
  return {
    id: wallet.id,
    name: wallet.name,
    type: wallet.type,
    currency: wallet.currency,
    initialBalance: wallet.initialBalance,
    currentBalance: computeBalance(wallet.initialBalance, movements),
    createdAt: wallet.createdAt,
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

  const movements = await walletRepository.sumAmountsByType(
    wallets.map((wallet) => wallet.id),
  );

  return {
    items: wallets.map((wallet) =>
      toView(
        wallet,
        movements.filter((movement) => movement.walletId === wallet.id),
      ),
    ),
    total,
  };
}

export async function getWallet(
  userId: string,
  walletId: string,
): Promise<WalletView> {
  const wallet = await ownedWallet(userId, walletId);
  const movements = await walletRepository.sumAmountsByType([wallet.id]);

  return toView(wallet, movements);
}

export async function createWallet(
  userId: string,
  input: CreateWalletInput,
): Promise<WalletView> {
  await assertNameIsFree(userId, input.name);

  const created = await walletRepository.create({ userId, ...input });

  return toView(created, []);
}

export async function updateWallet(
  userId: string,
  walletId: string,
  input: UpdateWalletInput,
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
  const movements = await walletRepository.sumAmountsByType([wallet.id]);

  return toView(updated, movements);
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
