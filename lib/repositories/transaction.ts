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

export type TransactionFilter = {
  from?: Date;
  to?: Date;
  walletIds?: readonly string[];
  categoryIds?: readonly string[];
  types?: readonly TransactionType[];
  query?: string;
  ascending?: boolean;
};

export type TypeTotal = {
  type: TransactionType;
  total: number;
};

export type TransactionRepository = {
  listByUser(
    userId: string,
    filter: TransactionFilter,
    page?: TransactionPage,
  ): Promise<TransactionRecord[]>;
  countByUser(userId: string, filter: TransactionFilter): Promise<number>;
  sumBaseAmountsByType(
    userId: string,
    filter: TransactionFilter,
  ): Promise<TypeTotal[]>;
  findById(id: string): Promise<TransactionRecord | null>;
  create(data: NewTransaction): Promise<TransactionRecord>;
  update(id: string, changes: TransactionChanges): Promise<TransactionRecord>;
  remove(id: string): Promise<void>;
};

function whereClause(userId: string, filter: TransactionFilter) {
  return {
    userId,
    walletId: filter.walletIds ? { in: [...filter.walletIds] } : undefined,
    categoryId: filter.categoryIds
      ? { in: [...filter.categoryIds] }
      : undefined,
    type: filter.types ? { in: [...filter.types] } : undefined,
    note: filter.query
      ? { contains: filter.query, mode: "insensitive" as const }
      : undefined,
    occurredAt:
      filter.from || filter.to
        ? { gte: filter.from, lte: filter.to }
        : undefined,
  };
}

export const transactionRepository: TransactionRepository = {
  listByUser(userId, filter, page) {
    const direction = filter.ascending ? "asc" : "desc";

    return prisma.transaction.findMany({
      where: whereClause(userId, filter),
      include: withReferences,
      orderBy: [{ occurredAt: direction }, { createdAt: direction }],
      skip: page?.skip,
      take: page?.take,
    });
  },

  countByUser(userId, filter) {
    return prisma.transaction.count({ where: whereClause(userId, filter) });
  },

  async sumBaseAmountsByType(userId, filter) {
    const groups = await prisma.transaction.groupBy({
      by: ["type"],
      where: whereClause(userId, filter),
      _sum: { baseAmount: true },
    });

    return groups.map((group) => ({
      type: group.type,
      total: group._sum.baseAmount ?? 0,
    }));
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
