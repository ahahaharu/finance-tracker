import { prisma } from "@/lib/db";
import { WalletNameTakenError } from "@/lib/errors";
import type { Currency, TransactionType, WalletType } from "@/lib/generated/prisma/enums";
import { Prisma, type Wallet } from "@/lib/generated/prisma/client";

export type NewWallet = {
  userId: string;
  name: string;
  type: WalletType;
  currency: Currency;
  initialBalance: number;
};

export type WalletChanges = {
  name: string;
  type: WalletType;
  initialBalance: number;
};

export type WalletMovement = {
  walletId: string;
  type: TransactionType;
  total: number;
};

export type WalletPage = {
  skip: number;
  take: number;
};

export type WalletRepository = {
  listByUser(userId: string, page?: WalletPage): Promise<Wallet[]>;
  countByUser(userId: string): Promise<number>;
  findById(id: string): Promise<Wallet | null>;
  findByName(userId: string, name: string): Promise<Wallet | null>;
  sumAmountsByType(
    userId: string,
    walletIds: readonly string[],
  ): Promise<WalletMovement[]>;
  countTransactions(walletId: string): Promise<number>;
  create(data: NewWallet): Promise<Wallet>;
  update(id: string, changes: WalletChanges): Promise<Wallet>;
  remove(id: string): Promise<void>;
};

const UNIQUE_VIOLATION = "P2002";

async function rejectDuplicateName<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === UNIQUE_VIOLATION
    ) {
      throw new WalletNameTakenError();
    }

    throw error;
  }
}

export const walletRepository: WalletRepository = {
  listByUser(userId, page) {
    return prisma.wallet.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      skip: page?.skip,
      take: page?.take,
    });
  },

  countByUser(userId) {
    return prisma.wallet.count({ where: { userId } });
  },

  findById(id) {
    return prisma.wallet.findUnique({ where: { id } });
  },

  findByName(userId, name) {
    return prisma.wallet.findUnique({ where: { userId_name: { userId, name } } });
  },

  async sumAmountsByType(userId, walletIds) {
    if (walletIds.length === 0) {
      return [];
    }

    const groups = await prisma.transaction.groupBy({
      by: ["walletId", "type"],
      where: { userId, walletId: { in: [...walletIds] } },
      _sum: { amount: true },
    });

    return groups.map((group) => ({
      walletId: group.walletId,
      type: group.type,
      total: group._sum.amount ?? 0,
    }));
  },

  countTransactions(walletId) {
    return prisma.transaction.count({ where: { walletId } });
  },

  create(data) {
    return rejectDuplicateName(() => prisma.wallet.create({ data }));
  },

  update(id, changes) {
    return rejectDuplicateName(() =>
      prisma.wallet.update({ where: { id }, data: changes }),
    );
  },

  async remove(id) {
    await prisma.wallet.delete({ where: { id } });
  },
};
