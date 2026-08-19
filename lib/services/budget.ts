import { endOfMonth } from "date-fns";

import {
  BudgetExistsError,
  CategoryKindMismatchError,
} from "@/lib/errors";
import type { Currency } from "@/lib/generated/prisma/enums";
import {
  type BudgetRecord,
  budgetRepository,
} from "@/lib/repositories/budget";
import { categoryRepository } from "@/lib/repositories/category";
import { transactionRepository } from "@/lib/repositories/transaction";
import type {
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/lib/schemas/budget";
import { assertOwnership } from "@/lib/services/access";
import { divideHalfUp } from "@/lib/services/exchange-rate";

export const NEAR_LIMIT_PERMILLE = 800;

export type BudgetUsage = {
  spentAmount: number;
  remainingAmount: number;
  usedPercent: number;
  isExceeded: boolean;
  isNearLimit: boolean;
};

export type BudgetView = BudgetUsage & {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  month: string;
  limitAmount: number;
  currency: Currency;
};

export function monthKey(month: string): Date {
  return new Date(`${month}-01T00:00:00.000Z`);
}

export function monthRange(month: string): { from: Date; to: Date } {
  const from = new Date(`${month}-01T00:00:00`);

  return { from, to: endOfMonth(from) };
}

export function monthLabel(month: Date): string {
  return month.toISOString().slice(0, 7);
}

export function computeUsage(
  limitAmount: number,
  spentAmount: number,
): BudgetUsage {
  const permille = Number(
    divideHalfUp(BigInt(spentAmount) * 1000n, BigInt(limitAmount)),
  );

  return {
    spentAmount,
    remainingAmount: limitAmount - spentAmount,
    usedPercent: permille / 10,
    isExceeded: spentAmount > limitAmount,
    isNearLimit:
      spentAmount * 1000 >= limitAmount * NEAR_LIMIT_PERMILLE &&
      spentAmount <= limitAmount,
  };
}

function toView(record: BudgetRecord, spentAmount: number): BudgetView {
  return {
    id: record.id,
    categoryId: record.categoryId,
    categoryName: record.category.name,
    categoryColor: record.category.color,
    month: monthLabel(record.month),
    limitAmount: record.limitAmount,
    currency: record.currency,
    ...computeUsage(record.limitAmount, spentAmount),
  };
}

async function spendingByCategory(
  userId: string,
  month: string,
): Promise<Map<string, number>> {
  const { from, to } = monthRange(month);
  const totals = await transactionRepository.sumBaseAmountsByCategory(userId, {
    from,
    to,
    types: ["EXPENSE"],
  });

  return new Map(totals.map((total) => [total.categoryId, total.total]));
}

async function ownedBudget(
  userId: string,
  budgetId: string,
): Promise<BudgetRecord> {
  const record = await budgetRepository.findById(budgetId);

  assertOwnership(record, userId);

  return record;
}

export async function listBudgets(
  userId: string,
  month: string,
): Promise<BudgetView[]> {
  const [records, spending] = await Promise.all([
    budgetRepository.listByMonth(userId, monthKey(month)),
    spendingByCategory(userId, month),
  ]);

  return records.map((record) =>
    toView(record, spending.get(record.categoryId) ?? 0),
  );
}

export async function getBudget(
  userId: string,
  budgetId: string,
): Promise<BudgetView> {
  const record = await ownedBudget(userId, budgetId);
  const spending = await spendingByCategory(userId, monthLabel(record.month));

  return toView(record, spending.get(record.categoryId) ?? 0);
}

export async function createBudget(
  userId: string,
  input: CreateBudgetInput,
  baseCurrency: Currency,
): Promise<BudgetView> {
  const category = await categoryRepository.findById(input.categoryId);

  assertOwnership(category, userId);

  if (category.kind !== "EXPENSE") {
    throw new CategoryKindMismatchError();
  }

  const month = monthKey(input.month);
  const existing = await budgetRepository.findByCategoryAndMonth(
    userId,
    category.id,
    month,
  );

  if (existing) {
    throw new BudgetExistsError();
  }

  const created = await budgetRepository.create({
    userId,
    categoryId: category.id,
    limitAmount: input.limitAmount,
    currency: baseCurrency,
    month,
  });

  const spending = await spendingByCategory(userId, input.month);

  return toView(created, spending.get(created.categoryId) ?? 0);
}

export async function updateBudget(
  userId: string,
  budgetId: string,
  input: UpdateBudgetInput,
): Promise<BudgetView> {
  const record = await ownedBudget(userId, budgetId);
  const updated = await budgetRepository.updateLimit(
    record.id,
    input.limitAmount,
  );
  const spending = await spendingByCategory(userId, monthLabel(record.month));

  return toView(updated, spending.get(record.categoryId) ?? 0);
}

export async function deleteBudget(
  userId: string,
  budgetId: string,
): Promise<void> {
  const record = await ownedBudget(userId, budgetId);

  await budgetRepository.remove(record.id);
}
