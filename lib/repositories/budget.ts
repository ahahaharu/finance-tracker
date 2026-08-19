import { prisma } from "@/lib/db";
import type { Budget } from "@/lib/generated/prisma/client";
import type { Currency } from "@/lib/generated/prisma/enums";

export type BudgetRecord = Budget & {
  category: { id: string; name: string; color: string };
};

export type NewBudget = {
  userId: string;
  categoryId: string;
  limitAmount: number;
  currency: Currency;
  month: Date;
};

export type BudgetRepository = {
  listByMonth(userId: string, month: Date): Promise<BudgetRecord[]>;
  findById(id: string): Promise<BudgetRecord | null>;
  findByCategoryAndMonth(
    userId: string,
    categoryId: string,
    month: Date,
  ): Promise<Budget | null>;
  create(data: NewBudget): Promise<BudgetRecord>;
  updateLimit(id: string, limitAmount: number): Promise<BudgetRecord>;
  remove(id: string): Promise<void>;
};

const withCategory = {
  category: { select: { id: true, name: true, color: true } },
} as const;

export const budgetRepository: BudgetRepository = {
  listByMonth(userId, month) {
    return prisma.budget.findMany({
      where: { userId, month },
      include: withCategory,
      orderBy: { category: { name: "asc" } },
    });
  },

  findById(id) {
    return prisma.budget.findUnique({ where: { id }, include: withCategory });
  },

  findByCategoryAndMonth(userId, categoryId, month) {
    return prisma.budget.findUnique({
      where: { userId_categoryId_month: { userId, categoryId, month } },
    });
  },

  create(data) {
    return prisma.budget.create({ data, include: withCategory });
  },

  updateLimit(id, limitAmount) {
    return prisma.budget.update({
      where: { id },
      data: { limitAmount },
      include: withCategory,
    });
  },

  async remove(id) {
    await prisma.budget.delete({ where: { id } });
  },
};
