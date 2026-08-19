import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TransactionRecord } from "@/lib/repositories/transaction";
import {
  listAllTransactions,
  listTransactions,
  summarise,
  toRepositoryFilter,
} from "@/lib/services/transaction";

const transactions = vi.hoisted(() => ({
  listByUser: vi.fn(),
  countByUser: vi.fn(),
  sumBaseAmountsByType: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/lib/repositories/transaction", () => ({
  transactionRepository: transactions,
}));
vi.mock("@/lib/repositories/wallet", () => ({ walletRepository: {} }));
vi.mock("@/lib/repositories/category", () => ({ categoryRepository: {} }));
vi.mock("@/lib/repositories/exchange-rate", () => ({
  exchangeRateRepository: {},
}));

const OWNER = "usr_1";
const NOW = new Date("2026-08-19T12:00:00.000Z");
const IN_BYN = { baseCurrency: "BYN", now: NOW } as const;

function record(overrides: Partial<TransactionRecord> = {}) {
  return {
    id: "txn_1",
    userId: OWNER,
    walletId: "wal_1",
    categoryId: "cat_1",
    type: "EXPENSE",
    amount: 5_000,
    currency: "BYN",
    baseAmount: 5_000,
    rate: { toFixed: () => "1.00000000" },
    rateDate: new Date("2026-08-18T00:00:00.000Z"),
    occurredAt: new Date("2026-08-18T09:00:00.000Z"),
    note: null,
    transferGroupId: null,
    createdAt: NOW,
    updatedAt: NOW,
    wallet: { id: "wal_1", name: "Наличные", currency: "BYN" },
    category: {
      id: "cat_1",
      name: "Продукты",
      color: "#8c6a4a",
      kind: "EXPENSE",
    },
    ...overrides,
  } as unknown as TransactionRecord;
}

function passedFilter() {
  return transactions.listByUser.mock.calls[0][1];
}

beforeEach(() => {
  vi.clearAllMocks();
  transactions.listByUser.mockResolvedValue([record()]);
  transactions.countByUser.mockResolvedValue(1);
  transactions.sumBaseAmountsByType.mockResolvedValue([]);
});

describe("toRepositoryFilter", () => {
  it("covers the whole last day of the period", () => {
    const filter = toRepositoryFilter({
      from: "2026-08-01",
      to: "2026-08-31",
      sort: "occurredAt:desc",
    });

    expect(filter.from).toEqual(new Date("2026-08-01T00:00:00"));
    expect(filter.to?.getHours()).toBe(23);
    expect(filter.to?.getMinutes()).toBe(59);
    expect(filter.to?.getDate()).toBe(31);
  });

  it("expands the transfer filter into both directions", () => {
    expect(
      toRepositoryFilter({ type: "TRANSFER", sort: "occurredAt:desc" }).types,
    ).toEqual(["TRANSFER_IN", "TRANSFER_OUT"]);
  });

  it("keeps a plain type as a single value", () => {
    expect(
      toRepositoryFilter({ type: "INCOME", sort: "occurredAt:desc" }).types,
    ).toEqual(["INCOME"]);
  });

  it("leaves the type open when it is not set", () => {
    expect(
      toRepositoryFilter({ sort: "occurredAt:desc" }).types,
    ).toBeUndefined();
  });

  it("reads the sort order", () => {
    expect(toRepositoryFilter({ sort: "occurredAt:asc" }).ascending).toBe(true);
    expect(toRepositoryFilter({ sort: "occurredAt:desc" }).ascending).toBe(
      false,
    );
  });
});

describe("summarise", () => {
  it("computes the balance of income and expense", () => {
    expect(
      summarise(
        [
          { type: "INCOME", total: 480_000 },
          { type: "EXPENSE", total: 312_450 },
        ],
        "BYN",
      ),
    ).toEqual({
      income: 480_000,
      expense: 312_450,
      net: 167_550,
      currency: "BYN",
    });
  });

  it("leaves transfers out of the totals", () => {
    expect(
      summarise(
        [
          { type: "INCOME", total: 100_000 },
          { type: "TRANSFER_IN", total: 900_000 },
          { type: "TRANSFER_OUT", total: 900_000 },
        ],
        "BYN",
      ),
    ).toEqual({
      income: 100_000,
      expense: 0,
      net: 100_000,
      currency: "BYN",
    });
  });

  it("reports zeroes for an empty set", () => {
    expect(summarise([], "USD")).toEqual({
      income: 0,
      expense: 0,
      net: 0,
      currency: "USD",
    });
  });
});

describe("listTransactions with filters", () => {
  it("passes every filter to the repository at once", async () => {
    await listTransactions(OWNER, IN_BYN, { page: 1, pageSize: 50 }, {
      from: "2026-08-01",
      to: "2026-08-31",
      walletId: ["wal_1", "wal_2"],
      categoryId: ["cat_1"],
      type: "EXPENSE",
      q: "продукты",
      sort: "occurredAt:asc",
    });

    expect(passedFilter()).toMatchObject({
      walletIds: ["wal_1", "wal_2"],
      categoryIds: ["cat_1"],
      types: ["EXPENSE"],
      query: "продукты",
      ascending: true,
    });
  });

  it("counts and sums against the same filter as the list", async () => {
    await listTransactions(OWNER, IN_BYN, undefined, {
      type: "INCOME",
      sort: "occurredAt:desc",
    });

    expect(transactions.countByUser).toHaveBeenCalledWith(
      OWNER,
      passedFilter(),
    );
    expect(transactions.sumBaseAmountsByType).toHaveBeenCalledWith(
      OWNER,
      passedFilter(),
    );
  });

  it("reports the totals of the current filter", async () => {
    transactions.sumBaseAmountsByType.mockResolvedValue([
      { type: "INCOME", total: 40_000 },
      { type: "EXPENSE", total: 15_000 },
    ]);

    const { totals } = await listTransactions(OWNER, IN_BYN);

    expect(totals).toEqual({
      income: 40_000,
      expense: 15_000,
      net: 25_000,
      currency: "BYN",
    });
  });
});

describe("listAllTransactions", () => {
  it("applies the filter and asks for no page at all", async () => {
    await listAllTransactions(OWNER, IN_BYN, {
      type: "EXPENSE",
      sort: "occurredAt:desc",
    });

    expect(transactions.listByUser).toHaveBeenCalledWith(
      OWNER,
      expect.objectContaining({ types: ["EXPENSE"] }),
    );
  });
});
