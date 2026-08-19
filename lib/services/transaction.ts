import {
  CategoryKindMismatchError,
  FutureDateError,
  NotFoundError,
} from "@/lib/errors";
import type { Category, Wallet } from "@/lib/generated/prisma/client";
import type { Currency, TransactionType } from "@/lib/generated/prisma/enums";
import { categoryRepository } from "@/lib/repositories/category";
import {
  type TransactionRecord,
  transactionRepository,
} from "@/lib/repositories/transaction";
import { walletRepository } from "@/lib/repositories/wallet";
import type { CollectionQuery } from "@/lib/schemas/collection";
import type {
  CreateTransactionInput,
  EntryType,
  UpdateTransactionInput,
} from "@/lib/schemas/transaction";
import { assertOwnership } from "@/lib/services/access";
import { convertAmount } from "@/lib/services/exchange-rate";

export type TransactionView = {
  id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  baseAmount: number;
  baseCurrency: Currency;
  rate: string;
  rateDate: Date;
  occurredAt: Date;
  note: string | null;
  wallet: { id: string; name: string };
  category: { id: string; name: string; color: string } | null;
};

export type TransactionList = {
  items: TransactionView[];
  total: number;
};

export type TransactionContext = {
  baseCurrency: Currency;
  now: Date;
};

export function transactionContext(user: {
  baseCurrency: Currency;
}): TransactionContext {
  return { baseCurrency: user.baseCurrency, now: new Date() };
}

function toView(
  record: TransactionRecord,
  baseCurrency: Currency,
): TransactionView {
  return {
    id: record.id,
    type: record.type,
    amount: record.amount,
    currency: record.currency,
    baseAmount: record.baseAmount,
    baseCurrency,
    rate: record.rate.toFixed(8),
    rateDate: record.rateDate,
    occurredAt: record.occurredAt,
    note: record.note,
    wallet: { id: record.wallet.id, name: record.wallet.name },
    category: record.category
      ? {
          id: record.category.id,
          name: record.category.name,
          color: record.category.color,
        }
      : null,
  };
}

function assertNotInFuture(occurredAt: Date, now: Date): void {
  if (occurredAt.getTime() > now.getTime()) {
    throw new FutureDateError();
  }
}

function assertKindMatches(type: EntryType, category: Category): void {
  if (category.kind !== type) {
    throw new CategoryKindMismatchError();
  }
}

async function ownedWallet(userId: string, walletId: string): Promise<Wallet> {
  const wallet = await walletRepository.findById(walletId);

  assertOwnership(wallet, userId);

  return wallet;
}

async function ownedCategory(
  userId: string,
  categoryId: string,
): Promise<Category> {
  const category = await categoryRepository.findById(categoryId);

  assertOwnership(category, userId);

  return category;
}

async function ownedTransaction(
  userId: string,
  transactionId: string,
): Promise<TransactionRecord> {
  const record = await transactionRepository.findById(transactionId);

  assertOwnership(record, userId);

  return record;
}

async function ownedEntry(
  userId: string,
  transactionId: string,
): Promise<TransactionRecord & { categoryId: string }> {
  const record = await ownedTransaction(userId, transactionId);

  if (record.transferGroupId !== null || record.categoryId === null) {
    throw new NotFoundError();
  }

  return { ...record, categoryId: record.categoryId };
}

export async function listTransactions(
  userId: string,
  context: TransactionContext,
  page?: CollectionQuery,
): Promise<TransactionList> {
  const [records, total] = await Promise.all([
    transactionRepository.listByUser(
      userId,
      page
        ? { skip: (page.page - 1) * page.pageSize, take: page.pageSize }
        : undefined,
    ),
    transactionRepository.countByUser(userId),
  ]);

  return {
    items: records.map((record) => toView(record, context.baseCurrency)),
    total,
  };
}

export async function getTransaction(
  userId: string,
  transactionId: string,
  context: TransactionContext,
): Promise<TransactionView> {
  const record = await ownedTransaction(userId, transactionId);

  return toView(record, context.baseCurrency);
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
  context: TransactionContext,
): Promise<TransactionView> {
  assertNotInFuture(input.occurredAt, context.now);

  const [wallet, category] = await Promise.all([
    ownedWallet(userId, input.walletId),
    ownedCategory(userId, input.categoryId),
  ]);

  assertKindMatches(input.type, category);

  const converted = await convertAmount({
    amount: input.amount,
    from: wallet.currency,
    to: context.baseCurrency,
    on: input.occurredAt,
  });

  const created = await transactionRepository.create({
    userId,
    walletId: wallet.id,
    categoryId: category.id,
    type: input.type,
    amount: input.amount,
    currency: wallet.currency,
    baseAmount: converted.amount,
    rate: converted.rate,
    rateDate: converted.rateDate,
    occurredAt: input.occurredAt,
    note: input.note ?? null,
  });

  return toView(created, context.baseCurrency);
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  input: UpdateTransactionInput,
  context: TransactionContext,
): Promise<TransactionView> {
  const record = await ownedEntry(userId, transactionId);

  const type = input.type ?? (record.type as EntryType);
  const amount = input.amount ?? record.amount;
  const occurredAt = input.occurredAt ?? record.occurredAt;

  assertNotInFuture(occurredAt, context.now);

  const [wallet, category] = await Promise.all([
    ownedWallet(userId, input.walletId ?? record.walletId),
    ownedCategory(userId, input.categoryId ?? record.categoryId),
  ]);

  assertKindMatches(type, category);

  const repriced =
    amount !== record.amount ||
    occurredAt.getTime() !== record.occurredAt.getTime() ||
    wallet.id !== record.walletId;

  const converted = repriced
    ? await convertAmount({
        amount,
        from: wallet.currency,
        to: context.baseCurrency,
        on: occurredAt,
      })
    : {
        amount: record.baseAmount,
        rate: record.rate.toFixed(8),
        rateDate: record.rateDate,
      };

  const updated = await transactionRepository.update(record.id, {
    walletId: wallet.id,
    categoryId: category.id,
    type,
    amount,
    currency: wallet.currency,
    baseAmount: converted.amount,
    rate: converted.rate,
    rateDate: converted.rateDate,
    occurredAt,
    note: input.note === undefined ? record.note : input.note,
  });

  return toView(updated, context.baseCurrency);
}

export async function deleteTransaction(
  userId: string,
  transactionId: string,
): Promise<void> {
  const record = await ownedEntry(userId, transactionId);

  await transactionRepository.remove(record.id);
}
