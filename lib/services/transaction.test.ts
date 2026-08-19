import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CategoryKindMismatchError,
  FutureDateError,
  NotFoundError,
  RateNotAvailableError,
} from "@/lib/errors";
import type { Category, Wallet } from "@/lib/generated/prisma/client";
import type {
  NewTransaction,
  TransactionChanges,
  TransactionRecord,
} from "@/lib/repositories/transaction";
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  updateTransaction,
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

const wallets = vi.hoisted(() => ({ findById: vi.fn() }));
const categories = vi.hoisted(() => ({ findById: vi.fn() }));
const rates = vi.hoisted(() => ({ findLatestOnOrBefore: vi.fn() }));

vi.mock("@/lib/repositories/transaction", () => ({
  transactionRepository: transactions,
}));
vi.mock("@/lib/repositories/wallet", () => ({ walletRepository: wallets }));
vi.mock("@/lib/repositories/category", () => ({
  categoryRepository: categories,
}));
vi.mock("@/lib/repositories/exchange-rate", () => ({
  exchangeRateRepository: rates,
}));

const OWNER = "usr_1";
const STRANGER = "usr_2";
const NOW = new Date("2026-08-19T12:00:00.000Z");
const IN_BYN = { baseCurrency: "BYN", now: NOW } as const;

function utc(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function walletFixture(overrides: Partial<Wallet> = {}): Wallet {
  return {
    id: "wal_1",
    userId: OWNER,
    name: "Наличные",
    type: "CASH",
    currency: "BYN",
    initialBalance: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

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

function decimal(value: string) {
  return { toFixed: () => value } as unknown as TransactionRecord["rate"];
}

function recordFixture(
  overrides: Partial<TransactionRecord> = {},
): TransactionRecord {
  return {
    id: "txn_1",
    userId: OWNER,
    walletId: "wal_1",
    categoryId: "cat_1",
    type: "EXPENSE",
    amount: 5_000,
    currency: "BYN",
    baseAmount: 5_000,
    rate: decimal("1.00000000"),
    rateDate: utc("2026-08-18"),
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
  };
}

function rateFixture(rate: string, date: string) {
  return {
    date: utc(date).toISOString(),
    fromCurrency: "USD",
    toCurrency: "BYN",
    rate,
  };
}

const input = {
  type: "EXPENSE",
  amount: 5_000,
  walletId: "wal_1",
  categoryId: "cat_1",
  occurredAt: new Date("2026-08-18T09:00:00.000Z"),
  note: "Продукты на неделю",
} as const;

function createdRow() {
  return transactions.create.mock.calls[0][0];
}

function updatedRow() {
  return transactions.update.mock.calls[0][1];
}

beforeEach(() => {
  vi.clearAllMocks();
  transactions.listByUser.mockResolvedValue([recordFixture()]);
  transactions.countByUser.mockResolvedValue(1);
  transactions.sumBaseAmountsByType.mockResolvedValue([]);
  transactions.findById.mockResolvedValue(recordFixture());
  transactions.create.mockImplementation((data: NewTransaction) =>
    Promise.resolve(
      recordFixture({ ...data, rate: decimal(data.rate), categoryId: data.categoryId }),
    ),
  );
  transactions.update.mockImplementation(
    (id: string, changes: TransactionChanges) =>
      Promise.resolve(recordFixture({ ...changes, id, rate: decimal(changes.rate) })),
  );
  wallets.findById.mockResolvedValue(walletFixture());
  categories.findById.mockResolvedValue(categoryFixture());
  rates.findLatestOnOrBefore.mockResolvedValue(null);
});

describe("createTransaction", () => {
  it("copies the currency of the wallet and stores the note", async () => {
    await createTransaction(OWNER, input, IN_BYN);

    expect(createdRow()).toMatchObject({
      userId: OWNER,
      walletId: "wal_1",
      categoryId: "cat_1",
      type: "EXPENSE",
      amount: 5_000,
      currency: "BYN",
      note: "Продукты на неделю",
    });
  });

  it("fixes the rate of the transaction date, not of today", async () => {
    wallets.findById.mockResolvedValue(walletFixture({ currency: "USD" }));
    rates.findLatestOnOrBefore.mockResolvedValue(
      rateFixture("3.20000000", "2026-08-18"),
    );

    await createTransaction(OWNER, input, IN_BYN);

    expect(rates.findLatestOnOrBefore).toHaveBeenCalledWith(
      "USD",
      utc("2026-08-18"),
    );
    expect(createdRow()).toMatchObject({
      baseAmount: 16_000,
      rate: "3.20000000",
      rateDate: utc("2026-08-18"),
    });
  });

  it("falls back to the nearest preceding rate and records its date", async () => {
    wallets.findById.mockResolvedValue(walletFixture({ currency: "USD" }));
    rates.findLatestOnOrBefore.mockResolvedValue(
      rateFixture("3.20000000", "2026-08-14"),
    );

    await createTransaction(OWNER, input, IN_BYN);

    expect(createdRow()).toMatchObject({ rateDate: utc("2026-08-14") });
  });

  it("refuses a date in the future", async () => {
    await expect(
      createTransaction(
        OWNER,
        { ...input, occurredAt: new Date("2026-08-20T09:00:00.000Z") },
        IN_BYN,
      ),
    ).rejects.toThrow(FutureDateError);
    expect(transactions.create).not.toHaveBeenCalled();
  });

  it("accepts a date earlier today", async () => {
    await expect(
      createTransaction(
        OWNER,
        { ...input, occurredAt: new Date("2026-08-19T11:59:00.000Z") },
        IN_BYN,
      ),
    ).resolves.toBeDefined();
  });

  it("refuses a category of the wrong kind", async () => {
    categories.findById.mockResolvedValue(categoryFixture({ kind: "INCOME" }));

    await expect(createTransaction(OWNER, input, IN_BYN)).rejects.toThrow(
      CategoryKindMismatchError,
    );
    expect(transactions.create).not.toHaveBeenCalled();
  });

  it("accepts an income against a category of income", async () => {
    categories.findById.mockResolvedValue(categoryFixture({ kind: "INCOME" }));

    await expect(
      createTransaction(OWNER, { ...input, type: "INCOME" }, IN_BYN),
    ).resolves.toBeDefined();
  });

  it("refuses a wallet of another user", async () => {
    wallets.findById.mockResolvedValue(walletFixture({ userId: STRANGER }));

    await expect(createTransaction(OWNER, input, IN_BYN)).rejects.toThrow(
      NotFoundError,
    );
    expect(transactions.create).not.toHaveBeenCalled();
  });

  it("refuses a category of another user", async () => {
    categories.findById.mockResolvedValue(
      categoryFixture({ userId: STRANGER }),
    );

    await expect(createTransaction(OWNER, input, IN_BYN)).rejects.toThrow(
      NotFoundError,
    );
    expect(transactions.create).not.toHaveBeenCalled();
  });

  it("refuses to store an amount it cannot convert", async () => {
    wallets.findById.mockResolvedValue(walletFixture({ currency: "USD" }));

    await expect(createTransaction(OWNER, input, IN_BYN)).rejects.toThrow(
      RateNotAvailableError,
    );
    expect(transactions.create).not.toHaveBeenCalled();
  });
});

describe("updateTransaction", () => {
  it("recomputes the reporting amount when the amount changes", async () => {
    await updateTransaction(OWNER, "txn_1", { amount: 7_000 }, IN_BYN);

    expect(updatedRow()).toMatchObject({ amount: 7_000, baseAmount: 7_000 });
  });

  it("recomputes by the rate of the new date", async () => {
    transactions.findById.mockResolvedValue(
      recordFixture({
        currency: "USD",
        baseAmount: 16_000,
        rate: decimal("3.20000000"),
        wallet: { id: "wal_1", name: "Накопления", currency: "USD" },
      }),
    );
    wallets.findById.mockResolvedValue(walletFixture({ currency: "USD" }));
    rates.findLatestOnOrBefore.mockResolvedValue(
      rateFixture("3.30000000", "2026-08-16"),
    );

    await updateTransaction(
      OWNER,
      "txn_1",
      { occurredAt: new Date("2026-08-16T09:00:00.000Z") },
      IN_BYN,
    );

    expect(rates.findLatestOnOrBefore).toHaveBeenCalledWith(
      "USD",
      utc("2026-08-16"),
    );
    expect(updatedRow()).toMatchObject({
      baseAmount: 16_500,
      rate: "3.30000000",
      rateDate: utc("2026-08-16"),
    });
  });

  it("keeps the fixed rate when only the note changes", async () => {
    transactions.findById.mockResolvedValue(
      recordFixture({
        currency: "USD",
        baseAmount: 16_000,
        rate: decimal("3.20000000"),
        rateDate: utc("2026-08-14"),
      }),
    );

    await updateTransaction(OWNER, "txn_1", { note: "Уточнение" }, IN_BYN);

    expect(rates.findLatestOnOrBefore).not.toHaveBeenCalled();
    expect(updatedRow()).toMatchObject({
      baseAmount: 16_000,
      rate: "3.20000000",
      rateDate: utc("2026-08-14"),
      note: "Уточнение",
    });
  });

  it("keeps the fixed rate when only the category changes", async () => {
    categories.findById.mockResolvedValue(categoryFixture({ id: "cat_2" }));

    await updateTransaction(OWNER, "txn_1", { categoryId: "cat_2" }, IN_BYN);

    expect(rates.findLatestOnOrBefore).not.toHaveBeenCalled();
    expect(updatedRow()).toMatchObject({ categoryId: "cat_2" });
  });

  it("recomputes when the wallet changes", async () => {
    wallets.findById.mockResolvedValue(
      walletFixture({ id: "wal_2", currency: "USD" }),
    );
    rates.findLatestOnOrBefore.mockResolvedValue(
      rateFixture("3.20000000", "2026-08-18"),
    );

    await updateTransaction(OWNER, "txn_1", { walletId: "wal_2" }, IN_BYN);

    expect(updatedRow()).toMatchObject({
      walletId: "wal_2",
      currency: "USD",
      baseAmount: 16_000,
    });
  });

  it("refuses a new date without any rate and leaves the record alone", async () => {
    transactions.findById.mockResolvedValue(
      recordFixture({
        currency: "USD",
        wallet: { id: "wal_1", name: "Накопления", currency: "USD" },
      }),
    );
    wallets.findById.mockResolvedValue(walletFixture({ currency: "USD" }));

    await expect(
      updateTransaction(
        OWNER,
        "txn_1",
        { occurredAt: new Date("2026-08-10T09:00:00.000Z") },
        IN_BYN,
      ),
    ).rejects.toThrow(RateNotAvailableError);
    expect(transactions.update).not.toHaveBeenCalled();
  });

  it("refuses a date in the future", async () => {
    await expect(
      updateTransaction(
        OWNER,
        "txn_1",
        { occurredAt: new Date("2026-08-20T09:00:00.000Z") },
        IN_BYN,
      ),
    ).rejects.toThrow(FutureDateError);
    expect(transactions.update).not.toHaveBeenCalled();
  });

  it("refuses a category that no longer matches the type", async () => {
    categories.findById.mockResolvedValue(categoryFixture({ kind: "INCOME" }));

    await expect(
      updateTransaction(OWNER, "txn_1", { categoryId: "cat_2" }, IN_BYN),
    ).rejects.toThrow(CategoryKindMismatchError);
    expect(transactions.update).not.toHaveBeenCalled();
  });

  it("refuses a transaction of another user", async () => {
    await expect(
      updateTransaction(STRANGER, "txn_1", { amount: 100 }, IN_BYN),
    ).rejects.toThrow(NotFoundError);
    expect(transactions.update).not.toHaveBeenCalled();
  });

  it("refuses to edit a leg of a transfer", async () => {
    transactions.findById.mockResolvedValue(
      recordFixture({
        type: "TRANSFER_OUT",
        categoryId: null,
        category: null,
        transferGroupId: "5f0f4bbd-9f2c-4d0c-8f34-3f27f5c1d0e1",
      }),
    );

    await expect(
      updateTransaction(OWNER, "txn_1", { amount: 100 }, IN_BYN),
    ).rejects.toThrow(NotFoundError);
    expect(transactions.update).not.toHaveBeenCalled();
  });
});

describe("deleteTransaction", () => {
  it("removes a transaction of the owner", async () => {
    await deleteTransaction(OWNER, "txn_1");

    expect(transactions.remove).toHaveBeenCalledWith("txn_1");
  });

  it("refuses a transaction of another user", async () => {
    await expect(deleteTransaction(STRANGER, "txn_1")).rejects.toThrow(
      NotFoundError,
    );
    expect(transactions.remove).not.toHaveBeenCalled();
  });

  it("refuses to remove a single leg of a transfer", async () => {
    transactions.findById.mockResolvedValue(
      recordFixture({
        type: "TRANSFER_IN",
        categoryId: null,
        category: null,
        transferGroupId: "5f0f4bbd-9f2c-4d0c-8f34-3f27f5c1d0e1",
      }),
    );

    await expect(deleteTransaction(OWNER, "txn_1")).rejects.toThrow(
      NotFoundError,
    );
    expect(transactions.remove).not.toHaveBeenCalled();
  });
});

describe("listTransactions and getTransaction", () => {
  it("reports the reporting currency alongside the stored amount", async () => {
    const { items, total } = await listTransactions(OWNER, IN_BYN);

    expect(total).toBe(1);
    expect(items[0]).toMatchObject({
      amount: 5_000,
      currency: "BYN",
      baseAmount: 5_000,
      baseCurrency: "BYN",
      wallet: { id: "wal_1", name: "Наличные" },
      category: { id: "cat_1", name: "Продукты", color: "#8c6a4a" },
    });
  });

  it("translates a page into skip and take", async () => {
    await listTransactions(OWNER, IN_BYN, { page: 2, pageSize: 50 });

    expect(transactions.listByUser).toHaveBeenCalledWith(
      OWNER,
      expect.anything(),
      { skip: 50, take: 50 },
    );
  });

  it("refuses a transaction of another user", async () => {
    await expect(getTransaction(STRANGER, "txn_1", IN_BYN)).rejects.toThrow(
      NotFoundError,
    );
  });
});
