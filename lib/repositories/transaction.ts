import { prisma } from "@/lib/db";
import type { Transaction } from "@/lib/generated/prisma/client";
import type {
  CategoryKind,
  Currency,
  TransactionType,
} from "@/lib/generated/prisma/enums";

export type TransactionRecord = Transaction & {
  wallet: { id: string; name: string; currency: Currency };
  category: {
    id: string;
    name: string;
    color: string;
    kind: CategoryKind;
  } | null;
};

const withReferences = {
  wallet: { select: { id: true, name: true, currency: true } },
  category: { select: { id: true, name: true, color: true, kind: true } },
} as const;

export type NewTransaction = {
  userId: string;
  walletId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  baseAmount: number;
  rate: string;
  rateDate: Date;
  occurredAt: Date;
  note: string | null;
};

export type TransactionChanges = Omit<NewTransaction, "userId">;

export type TransactionPage = {
  skip: number;
  take: number;
};

export type TransactionRepository = {
  listByUser(
    userId: string,
    page?: TransactionPage,
  ): Promise<TransactionRecord[]>;
  countByUser(userId: string): Promise<number>;
  findById(id: string): Promise<TransactionRecord | null>;
  create(data: NewTransaction): Promise<TransactionRecord>;
  update(id: string, changes: TransactionChanges): Promise<TransactionRecord>;
  remove(id: string): Promise<void>;
};

export const transactionRepository: TransactionRepository = {
  listByUser(userId, page) {
    return prisma.transaction.findMany({
      where: { userId },
      include: withReferences,
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      skip: page?.skip,
      take: page?.take,
    });
  },

  countByUser(userId) {
    return prisma.transaction.count({ where: { userId } });
  },

  findById(id) {
    return prisma.transaction.findUnique({
      where: { id },
      include: withReferences,
    });
  },

  create(data) {
    return prisma.transaction.create({ data, include: withReferences });
  },

  update(id, changes) {
    return prisma.transaction.update({
      where: { id },
      data: changes,
      include: withReferences,
    });
  },

  async remove(id) {
    await prisma.transaction.delete({ where: { id } });
  },
};
