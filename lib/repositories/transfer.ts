import { prisma } from "@/lib/db";
import type { Currency, TransactionType } from "@/lib/generated/prisma/enums";
import type { TransactionRecord } from "@/lib/repositories/transaction";

export type TransferLeg = {
  userId: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  baseAmount: number;
  rate: string;
  rateDate: Date;
  occurredAt: Date;
  note: string | null;
  transferGroupId: string;
};

export type TransferRepository = {
  createPair(legs: readonly [TransferLeg, TransferLeg]): Promise<
    TransactionRecord[]
  >;
  findByGroupId(groupId: string): Promise<TransactionRecord[]>;
  removeByGroupId(groupId: string): Promise<number>;
};

const withReferences = {
  wallet: { select: { id: true, name: true, currency: true } },
  category: { select: { id: true, name: true, color: true, kind: true } },
} as const;

export const transferRepository: TransferRepository = {
  createPair(legs) {
    return prisma.$transaction(
      legs.map((leg) =>
        prisma.transaction.create({
          data: { ...leg, categoryId: null },
          include: withReferences,
        }),
      ),
    );
  },

  findByGroupId(groupId) {
    return prisma.transaction.findMany({
      where: { transferGroupId: groupId },
      include: withReferences,
      orderBy: { type: "desc" },
    });
  },

  async removeByGroupId(groupId) {
    const { count } = await prisma.transaction.deleteMany({
      where: { transferGroupId: groupId },
    });

    return count;
  },
};
