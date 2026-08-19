import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Category, Wallet } from "@/lib/generated/prisma/client";
import {
  canAdvance,
  computeShare,
  containsDate,
  getCategoryBreakdown,
  getMonthlyTrend,
  getPeriodTotals,
  getSummary,
  periodOf,
  rangeBounds,
  shiftAnchor,
} from "@/lib/services/analytics";

const transactions = vi.hoisted(() => ({
  sumBaseAmountsByType: vi.fn(),
  sumBaseAmountsByCategory: vi.fn(),
}));

const categories = vi.hoisted(() => ({ listByUser: vi.fn() }));

const wallets = vi.hoisted(() => ({
  listByUser: vi.fn(),
  countByUser: vi.fn(),
  sumAmountsByType: vi.fn(),
}));

const rates = vi.hoisted(() => ({
  findLatestOnOrBefore: vi.fn(),
  listLatestOnOrBefore: vi.fn(),
  saveMany: vi.fn(),
}));

vi.mock("@/lib/repositories/transaction", () => ({
  transactionRepository: transactions,
}));
vi.mock("@/lib/repositories/category", () => ({
  categoryRepository: categories,
}));
vi.mock("@/lib/repositories/wallet", () => ({ walletRepository: wallets }));
vi.mock("@/lib/repositories/exchange-rate", () => ({
  exchangeRateRepository: rates,
}));

const OWNER = "usr_1";
const NOW = new Date("2026-08-19T12:00:00.000Z");
const AUGUST = { from: new Date("2026-08-01T00:00:00"), to: new Date("2026-08-31T23:59:59.999") };
const IN_BYN = { baseCurrency: "BYN", on: NOW } as const;

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

function walletFixture(overrides: Partial<Wallet> = {}): Wallet {
  return {
    id: "wal_1",
    userId: OWNER,
    name: "Наличные",
    type: "CASH",
    currency: "BYN",
    initialBalance: 100_000,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function categoryFilter() {
  return transactions.sumBaseAmountsByCategory.mock.calls[0][1];
}

beforeEach(() => {
  vi.clearAllMocks();
  transactions.sumBaseAmountsByType.mockResolvedValue([]);
  transactions.sumBaseAmountsByCategory.mockResolvedValue([]);
  categories.listByUser.mockResolvedValue([categoryFixture()]);
  wallets.listByUser.mockResolvedValue([walletFixture()]);
  wallets.countByUser.mockResolvedValue(1);
  wallets.sumAmountsByType.mockResolvedValue([]);
  rates.findLatestOnOrBefore.mockResolvedValue(null);
});

describe("periodOf", () => {
  it("falls back to the current month", () => {
    const period = periodOf({}, NOW);

    expect(period.from.getMonth()).toBe(7);
    expect(period.from.getDate()).toBe(1);
    expect(period.to.getDate()).toBe(31);
  });

  it("covers the whole of the last requested day", () => {
    const period = periodOf({ from: "2026-03-10", to: "2026-03-12" }, NOW);

    expect(period.from.getHours()).toBe(0);
    expect(period.to.getDate()).toBe(12);
    expect(period.to.getHours()).toBe(23);
  });
});

describe("rangeBounds", () => {
  const anchor = new Date("2026-05-17T09:30:00");

  it("covers a single day", () => {
    const period = rangeBounds("day", anchor, anchor);

    expect(period.from.getDate()).toBe(17);
    expect(period.from.getHours()).toBe(0);
    expect(period.to.getDate()).toBe(17);
    expect(period.to.getHours()).toBe(23);
  });

  it("covers the whole month of its anchor", () => {
    const period = rangeBounds("month", anchor, anchor);

    expect(period.from.getDate()).toBe(1);
    expect(period.from.getMonth()).toBe(4);
    expect(period.to.getDate()).toBe(31);
  });

  it("covers the whole year of its anchor", () => {
    const period = rangeBounds("year", anchor, anchor);

    expect(period.from.getMonth()).toBe(0);
    expect(period.from.getDate()).toBe(1);
    expect(period.to.getMonth()).toBe(11);
    expect(period.to.getDate()).toBe(31);
  });

  it("keeps both ends of a custom range", () => {
    const period = rangeBounds(
      "custom",
      anchor,
      new Date("2026-06-02T00:00:00"),
    );

    expect(period.from.getMonth()).toBe(4);
    expect(period.to.getMonth()).toBe(5);
    expect(period.to.getDate()).toBe(2);
  });

  it("refuses to end a custom range before it starts", () => {
    const period = rangeBounds(
      "custom",
      anchor,
      new Date("2026-04-02T00:00:00"),
    );

    expect(period.to.getMonth()).toBe(4);
    expect(period.to.getDate()).toBe(17);
  });
});

describe("containsDate and canAdvance", () => {
  const TODAY = new Date("2026-08-20T14:00:00");

  it("recognises the period holding today", () => {
    const august = rangeBounds("month", TODAY, TODAY);

    expect(containsDate(august, TODAY)).toBe(true);
    expect(containsDate(august, new Date("2026-07-31T23:00:00"))).toBe(false);
  });

  it("offers no step forward out of the running period", () => {
    const august = rangeBounds("month", TODAY, TODAY);
    const july = rangeBounds("month", new Date("2026-07-04T00:00:00"), TODAY);

    expect(canAdvance(august, TODAY)).toBe(false);
    expect(canAdvance(july, TODAY)).toBe(true);
  });

  it("treats the running day and year the same way", () => {
    expect(canAdvance(rangeBounds("day", TODAY, TODAY), TODAY)).toBe(false);
    expect(canAdvance(rangeBounds("year", TODAY, TODAY), TODAY)).toBe(false);
    expect(
      canAdvance(
        rangeBounds("day", new Date("2026-08-19T00:00:00"), TODAY),
        TODAY,
      ),
    ).toBe(true);
  });
});

describe("shiftAnchor", () => {
  it("steps by the unit of its range", () => {
    const anchor = new Date("2026-05-17T00:00:00");

    expect(shiftAnchor("day", anchor, -1).getDate()).toBe(16);
    expect(shiftAnchor("month", anchor, 1).getMonth()).toBe(5);
    expect(shiftAnchor("year", anchor, -1).getFullYear()).toBe(2025);
  });

  it("crosses the turn of the year", () => {
    const december = new Date("2026-12-11T00:00:00");
    const next = shiftAnchor("month", december, 1);

    expect(next.getFullYear()).toBe(2027);
    expect(next.getMonth()).toBe(0);
  });

  it("keeps a month step inside the month it lands on", () => {
    const period = rangeBounds(
      "month",
      shiftAnchor("month", new Date("2026-01-31T00:00:00"), 1),
      new Date("2026-01-31T00:00:00"),
    );

    expect(period.from.getMonth()).toBe(1);
    expect(period.to.getDate()).toBe(28);
  });
});

describe("computeShare", () => {
  it("reports the share with a tenth of a per cent", () => {
    expect(computeShare(1, 3)).toBe(33.3);
    expect(computeShare(2, 3)).toBe(66.7);
    expect(computeShare(1, 4)).toBe(25);
  });

  it("rounds halves up", () => {
    expect(computeShare(1_875, 10_000)).toBe(18.8);
  });

  it("reports nothing spent as a zero share", () => {
    expect(computeShare(0, 0)).toBe(0);
  });
});

describe("getPeriodTotals", () => {
  it("leaves transfers out of income, expense and net", async () => {
    transactions.sumBaseAmountsByType.mockResolvedValue([
      { type: "INCOME", total: 500_000 },
      { type: "EXPENSE", total: 320_000 },
      { type: "TRANSFER_IN", total: 200_000 },
      { type: "TRANSFER_OUT", total: 200_000 },
    ]);

    const totals = await getPeriodTotals(OWNER, "BYN", AUGUST);

    expect(totals).toEqual({
      income: 500_000,
      expense: 320_000,
      net: 180_000,
      currency: "BYN",
    });
  });

  it("asks the repository for the period of its own user", async () => {
    await getPeriodTotals(OWNER, "BYN", AUGUST);

    expect(transactions.sumBaseAmountsByType).toHaveBeenCalledWith(OWNER, {
      from: AUGUST.from,
      to: AUGUST.to,
    });
  });

  it("reports an empty period as zero", async () => {
    const totals = await getPeriodTotals(OWNER, "USD", AUGUST);

    expect(totals).toEqual({ income: 0, expense: 0, net: 0, currency: "USD" });
  });
});

describe("getSummary", () => {
  it("puts the balance of all wallets next to the period figures", async () => {
    wallets.sumAmountsByType.mockResolvedValue([
      { walletId: "wal_1", type: "EXPENSE", total: 40_000 },
    ]);
    transactions.sumBaseAmountsByType.mockResolvedValue([
      { type: "EXPENSE", total: 40_000 },
    ]);

    const summary = await getSummary(OWNER, IN_BYN, AUGUST);

    expect(summary.totalBalance).toEqual({
      amount: 60_000,
      currency: "BYN",
      complete: true,
    });
    expect(summary.totals).toMatchObject({ expense: 40_000, net: -40_000 });
    expect(summary.period).toBe(AUGUST);
  });

  it("marks the balance as incomplete when a rate is missing", async () => {
    wallets.listByUser.mockResolvedValue([
      walletFixture(),
      walletFixture({ id: "wal_2", currency: "USD", initialBalance: 5_000 }),
    ]);

    const summary = await getSummary(OWNER, IN_BYN, AUGUST);

    expect(summary.totalBalance).toMatchObject({
      amount: 100_000,
      complete: false,
    });
  });
});

describe("getCategoryBreakdown", () => {
  it("counts expenses only, and only within the period", async () => {
    await getCategoryBreakdown(OWNER, "BYN", AUGUST);

    expect(transactions.sumBaseAmountsByCategory).toHaveBeenCalledWith(
      OWNER,
      expect.anything(),
    );
    expect(categoryFilter()).toEqual({
      from: AUGUST.from,
      to: AUGUST.to,
      types: ["EXPENSE"],
    });
  });

  it("orders categories by amount and gives each its share", async () => {
    categories.listByUser.mockResolvedValue([
      categoryFixture(),
      categoryFixture({ id: "cat_2", name: "Транспорт", color: "#6e7f5c" }),
    ]);
    transactions.sumBaseAmountsByCategory.mockResolvedValue([
      { categoryId: "cat_2", total: 25_000 },
      { categoryId: "cat_1", total: 75_000 },
    ]);

    const shares = await getCategoryBreakdown(OWNER, "BYN", AUGUST);

    expect(shares).toEqual([
      {
        categoryId: "cat_1",
        name: "Продукты",
        color: "#8c6a4a",
        amount: 75_000,
        share: 75,
        currency: "BYN",
      },
      {
        categoryId: "cat_2",
        name: "Транспорт",
        color: "#6e7f5c",
        amount: 25_000,
        share: 25,
        currency: "BYN",
      },
    ]);
  });

  it("leaves out categories without spending", async () => {
    transactions.sumBaseAmountsByCategory.mockResolvedValue([
      { categoryId: "cat_1", total: 0 },
    ]);

    expect(await getCategoryBreakdown(OWNER, "BYN", AUGUST)).toEqual([]);
  });

  it("reports an empty period as an empty breakdown", async () => {
    expect(await getCategoryBreakdown(OWNER, "BYN", AUGUST)).toEqual([]);
  });
});

describe("getMonthlyTrend", () => {
  it("returns six months ending with the current one", async () => {
    const points = await getMonthlyTrend(OWNER, "BYN", NOW);

    expect(points.map((point) => point.month)).toEqual([
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
  });

  it("asks for whole months of its own user", async () => {
    await getMonthlyTrend(OWNER, "BYN", NOW, 2);

    const [firstUser, firstFilter] = transactions.sumBaseAmountsByType.mock.calls[0];

    expect(firstUser).toBe(OWNER);
    expect(firstFilter.from.getMonth()).toBe(6);
    expect(firstFilter.from.getDate()).toBe(1);
    expect(firstFilter.to.getMonth()).toBe(6);
    expect(firstFilter.to.getDate()).toBe(31);
  });

  it("keeps transfers out of every month", async () => {
    transactions.sumBaseAmountsByType.mockResolvedValue([
      { type: "EXPENSE", total: 30_000 },
      { type: "TRANSFER_OUT", total: 90_000 },
    ]);

    const points = await getMonthlyTrend(OWNER, "BYN", NOW, 1);

    expect(points).toEqual([
      { month: "2026-08", income: 0, expense: 30_000, currency: "BYN" },
    ]);
  });

  it("reports a month without operations as zero", async () => {
    const points = await getMonthlyTrend(OWNER, "BYN", NOW, 1);

    expect(points[0]).toMatchObject({ income: 0, expense: 0 });
  });
});
