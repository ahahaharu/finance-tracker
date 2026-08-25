import { prisma } from "@/lib/db";
import type { Currency } from "@/lib/generated/prisma/enums";
import type { User } from "@/lib/generated/prisma/client";

export type RebaseTransaction = {
  id: string;
  amount: number;
  currency: Currency;
  rateDate: Date;
};

export type RebaseBudget = {
  id: string;
  limitAmount: number;
  currency: Currency;
  month: Date;
};

export type TransactionRebase = {
  id: string;
  baseAmount: number;
  rate: string;
  rateDate: Date;
};

export type BudgetRebase = {
  id: string;
  limitAmount: number;
  currency: Currency;
};

export type ProfileRepository = {
  listTransactionsToRebase(userId: string): Promise<RebaseTransaction[]>;
  listBudgetsToRebase(userId: string): Promise<RebaseBudget[]>;
  applyBaseCurrency(input: {
    userId: string;
    baseCurrency: Currency;
    name?: string;
    locale?: string;
    transactions: readonly TransactionRebase[];
    budgets: readonly BudgetRebase[];
  }): Promise<User>;
};

const REBASE_TIMEOUT_MS = 120_000;

export const profileRepository: ProfileRepository = {
  listTransactionsToRebase(userId) {
    return prisma.transaction.findMany({
      where: { userId },
      select: { id: true, amount: true, currency: true, rateDate: true },
    });
  },

  listBudgetsToRebase(userId) {
    return prisma.budget.findMany({
      where: { userId },
      select: { id: true, limitAmount: true, currency: true, month: true },
    });
  },

  applyBaseCurrency({
    userId,
    baseCurrency,
    name,
    locale,
    transactions,
    budgets,
  }) {
    return prisma.$transaction(
      async (tx) => {
        for (const transaction of transactions) {
          await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              baseAmount: transaction.baseAmount,
              rate: transaction.rate,
              rateDate: transaction.rateDate,
            },
          });
        }

        for (const budget of budgets) {
          await tx.budget.update({
            where: { id: budget.id },
            data: {
              limitAmount: budget.limitAmount,
              currency: budget.currency,
            },
          });
        }

        return tx.user.update({
          where: { id: userId },
          data: { baseCurrency, name, locale },
        });
      },
      { timeout: REBASE_TIMEOUT_MS },
    );
  },
};
