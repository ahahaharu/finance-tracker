import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BudgetExistsError,
  CategoryKindMismatchError,
  NotFoundError,
} from "@/lib/errors";
import type { Budget, Category } from "@/lib/generated/prisma/client";
import type { BudgetRecord } from "@/lib/repositories/budget";
import {
  computeUsage,
  createBudget,
  deleteBudget,
  getBudget,
  listBudgets,
  updateBudget,
} from "@/lib/services/budget";

const budgets = vi.hoisted(() => ({
  listByMonth: vi.fn(),
  findById: vi.fn(),
  findByCategoryAndMonth: vi.fn(),
  create: vi.fn(),
  updateLimit: vi.fn(),
  remove: vi.fn(),
}));

const categories = vi.hoisted(() => ({ findById: vi.fn() }));
const transactions = vi.hoisted(() => ({ sumBaseAmountsByCategory: vi.fn() }));

vi.mock("@/lib/repositories/budget", () => ({ budgetRepository: budgets }));
vi.mock("@/lib/repositories/category", () => ({
  categoryRepository: categories,
}));
vi.mock("@/lib/repositories/transaction", () => ({
  transactionRepository: transactions,
}));

const OWNER = "usr_1";
const STRANGER = "usr_2";
const MONTH = "2026-08";
const NOW = new Date("2026-08-19T12:00:00.000Z");

function categoryFixture(overrides: Partial<Category> = {}): Category {
  return {
    id: "cat_1",
    userId: OWNER,
    name: "Продукты",
    kind: "EXPENSE",
    color: "#8c6a4a",
    isDefault: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function budgetFixture(overrides: Partial<Budget> = {}): BudgetRecord {
  return {
    id: "bud_1",
    userId: OWNER,
    categoryId: "cat_1",
    limitAmount: 40_000,
    currency: "BYN",
    month: new Date("2026-08-01T00:00:00.000Z"),
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
    category: { id: "cat_1", name: "Продукты", color: "#8c6a4a" },
  };
}

function spendingFilter() {
  return transactions.sumBaseAmountsByCategory.mock.calls[0][1];
}

beforeEach(() => {
  vi.clearAllMocks();
  budgets.listByMonth.mockResolvedValue([budgetFixture()]);
  budgets.findById.mockResolvedValue(budgetFixture());
  budgets.findByCategoryAndMonth.mockResolvedValue(null);
  budgets.create.mockImplementation((data: Budget) =>
    Promise.resolve(budgetFixture(data)),
  );
  budgets.updateLimit.mockImplementation((id: string, limitAmount: number) =>
    Promise.resolve(budgetFixture({ id, limitAmount })),
  );
  categories.findById.mockResolvedValue(categoryFixture());
  transactions.sumBaseAmountsByCategory.mockResolvedValue([]);
});

describe("computeUsage", () => {
  it("reports what is left and the share used", () => {
    expect(computeUsage(40_000, 31_240)).toMatchObject({
      spentAmount: 31_240,
      remainingAmount: 8_760,
      usedPercent: 78.1,
      isExceeded: false,
      isNearLimit: false,
    });
  });

  it("marks the budget as near its limit from eighty per cent", () => {
    expect(computeUsage(10_000, 7_999).isNearLimit).toBe(false);
    expect(computeUsage(10_000, 8_000).isNearLimit).toBe(true);
    expect(computeUsage(10_000, 10_000).isNearLimit).toBe(true);
  });

  it("marks the budget as exceeded only above the limit", () => {
    expect(computeUsage(10_000, 10_000).isExceeded).toBe(false);
    expect(computeUsage(10_000, 10_001).isExceeded).toBe(true);
  });

  it("reports a negative remainder when the limit is exceeded", () => {
    expect(computeUsage(10_000, 12_500)).toMatchObject({
      remainingAmount: -2_500,
      usedPercent: 125,
      isExceeded: true,
      isNearLimit: false,
    });
  });

  it("reports an untouched budget as empty", () => {
    expect(computeUsage(10_000, 0)).toMatchObject({
      remainingAmount: 10_000,
      usedPercent: 0,
      isExceeded: false,
    });
  });

  it("rounds the share to a tenth of a per cent", () => {
    expect(computeUsage(3, 1).usedPercent).toBe(33.3);
    expect(computeUsage(3, 2).usedPercent).toBe(66.7);
  });
});

describe("listBudgets", () => {
  it("counts only expenses of the requested month", async () => {
    await listBudgets(OWNER, MONTH);

    expect(spendingFilter()).toMatchObject({ types: ["EXPENSE"] });
    expect(spendingFilter().from.getMonth()).toBe(7);
    expect(spendingFilter().from.getDate()).toBe(1);
    expect(spendingFilter().to.getDate()).toBe(31);
  });

  it("matches spending to its own category", async () => {
    budgets.listByMonth.mockResolvedValue([
      budgetFixture(),
      budgetFixture({ id: "bud_2", categoryId: "cat_2" }),
    ]);
    transactions.sumBaseAmountsByCategory.mockResolvedValue([
      { categoryId: "cat_2", total: 5_000 },
    ]);

    const items = await listBudgets(OWNER, MONTH);

    expect(items[0].spentAmount).toBe(0);
    expect(items[1].spentAmount).toBe(5_000);
  });

  it("asks the repository for the first day of the month", async () => {
    await listBudgets(OWNER, MONTH);

    expect(budgets.listByMonth).toHaveBeenCalledWith(
      OWNER,
      new Date("2026-08-01T00:00:00.000Z"),
    );
  });
});

describe("createBudget", () => {
  const input = { categoryId: "cat_1", limitAmount: 40_000, month: MONTH };

  it("stores the limit in the reporting currency", async () => {
    await createBudget(OWNER, input, "USD");

    expect(budgets.create).toHaveBeenCalledWith({
      userId: OWNER,
      categoryId: "cat_1",
      limitAmount: 40_000,
      currency: "USD",
      month: new Date("2026-08-01T00:00:00.000Z"),
    });
  });

  it("refuses a category of income", async () => {
    categories.findById.mockResolvedValue(categoryFixture({ kind: "INCOME" }));

    await expect(createBudget(OWNER, input, "BYN")).rejects.toThrow(
      CategoryKindMismatchError,
    );
    expect(budgets.create).not.toHaveBeenCalled();
  });

  it("refuses a category of another user", async () => {
    categories.findById.mockResolvedValue(
      categoryFixture({ userId: STRANGER }),
    );

    await expect(createBudget(OWNER, input, "BYN")).rejects.toThrow(
      NotFoundError,
    );
    expect(budgets.create).not.toHaveBeenCalled();
  });

  it("refuses a second budget for the same category and month", async () => {
    budgets.findByCategoryAndMonth.mockResolvedValue(budgetFixture());

    await expect(createBudget(OWNER, input, "BYN")).rejects.toThrow(
      BudgetExistsError,
    );
    expect(budgets.create).not.toHaveBeenCalled();
  });

  it("allows the same category in another month", async () => {
    await createBudget(OWNER, { ...input, month: "2026-09" }, "BYN");

    expect(budgets.findByCategoryAndMonth).toHaveBeenCalledWith(
      OWNER,
      "cat_1",
      new Date("2026-09-01T00:00:00.000Z"),
    );
    expect(budgets.create).toHaveBeenCalled();
  });

  it("reports the spending the category already has", async () => {
    transactions.sumBaseAmountsByCategory.mockResolvedValue([
      { categoryId: "cat_1", total: 36_000 },
    ]);

    const budget = await createBudget(OWNER, input, "BYN");

    expect(budget).toMatchObject({
      spentAmount: 36_000,
      usedPercent: 90,
      isNearLimit: true,
    });
  });
});

describe("updateBudget and deleteBudget", () => {
  it("changes the limit and recomputes the usage", async () => {
    transactions.sumBaseAmountsByCategory.mockResolvedValue([
      { categoryId: "cat_1", total: 20_000 },
    ]);

    const budget = await updateBudget(OWNER, "bud_1", { limitAmount: 10_000 });

    expect(budgets.updateLimit).toHaveBeenCalledWith("bud_1", 10_000);
    expect(budget).toMatchObject({ isExceeded: true, usedPercent: 200 });
  });

  it("refuses a budget of another user", async () => {
    await expect(
      updateBudget(STRANGER, "bud_1", { limitAmount: 10_000 }),
    ).rejects.toThrow(NotFoundError);
    expect(budgets.updateLimit).not.toHaveBeenCalled();
  });

  it("removes a budget of the owner", async () => {
    await deleteBudget(OWNER, "bud_1");

    expect(budgets.remove).toHaveBeenCalledWith("bud_1");
  });

  it("refuses to remove a budget of another user", async () => {
    await expect(deleteBudget(STRANGER, "bud_1")).rejects.toThrow(
      NotFoundError,
    );
    expect(budgets.remove).not.toHaveBeenCalled();
  });

  it("refuses a budget that does not exist", async () => {
    budgets.findById.mockResolvedValue(null);

    await expect(getBudget(OWNER, "bud_1")).rejects.toThrow(NotFoundError);
  });
});
