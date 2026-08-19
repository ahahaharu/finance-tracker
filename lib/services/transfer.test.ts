import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FutureDateError,
  NotFoundError,
  RateNotAvailableError,
  SameWalletTransferError,
  ValidationFailedError,
} from "@/lib/errors";
import type { Wallet } from "@/lib/generated/prisma/client";
import type { TransactionRecord } from "@/lib/repositories/transaction";
import type { TransferLeg } from "@/lib/repositories/transfer";
import { computeBalance } from "@/lib/services/wallet";
import {
  createTransfer,
  deleteTransfer,
  getTransfer,
  transferRate,
} from "@/lib/services/transfer";

const transfers = vi.hoisted(() => ({
  createPair: vi.fn(),
  findByGroupId: vi.fn(),
  removeByGroupId: vi.fn(),
}));

const wallets = vi.hoisted(() => ({ findById: vi.fn() }));
const rates = vi.hoisted(() => ({ findLatestOnOrBefore: vi.fn() }));

vi.mock("@/lib/repositories/transfer", () => ({
  transferRepository: transfers,
}));
vi.mock("@/lib/repositories/wallet", () => ({ walletRepository: wallets }));
vi.mock("@/lib/repositories/exchange-rate", () => ({
  exchangeRateRepository: rates,
}));

const OWNER = "usr_1";
const STRANGER = "usr_2";
const NOW = new Date("2026-08-19T12:00:00.000Z");
const IN_BYN = { baseCurrency: "BYN", now: NOW } as const;
const GROUP = "5f0f4bbd-9f2c-4d0c-8f34-3f27f5c1d0e1";
const OCCURRED = new Date("2026-08-18T09:00:00.000Z");

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

function walletsByCurrency(from: Wallet, to: Wallet) {
  wallets.findById.mockImplementation((id: string) =>
    Promise.resolve(id === from.id ? from : id === to.id ? to : null),
  );
}

function legRecord(leg: TransferLeg): TransactionRecord {
  return {
    id: `txn_${leg.type}`,
    userId: leg.userId,
    walletId: leg.walletId,
    categoryId: null,
    type: leg.type,
    amount: leg.amount,
    currency: leg.currency,
    baseAmount: leg.baseAmount,
    rate: { toFixed: () => leg.rate },
    rateDate: leg.rateDate,
    occurredAt: leg.occurredAt,
    note: leg.note,
    transferGroupId: leg.transferGroupId,
    createdAt: NOW,
    updatedAt: NOW,
    wallet: {
      id: leg.walletId,
      name: leg.walletId === "wal_1" ? "Наличные" : "Накопления",
      currency: leg.currency,
    },
    category: null,
  } as unknown as TransactionRecord;
}

function createdLegs(): TransferLeg[] {
  return transfers.createPair.mock.calls[0][0] as TransferLeg[];
}

const input = {
  fromWalletId: "wal_1",
  toWalletId: "wal_2",
  amountFrom: 30_000,
  occurredAt: OCCURRED,
  note: "На накопительный",
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  walletsByCurrency(
    walletFixture(),
    walletFixture({ id: "wal_2", name: "Накопления", initialBalance: 0 }),
  );
  rates.findLatestOnOrBefore.mockResolvedValue(null);
  transfers.createPair.mockImplementation((legs: TransferLeg[]) =>
    Promise.resolve(legs.map(legRecord)),
  );
  transfers.findByGroupId.mockResolvedValue([]);
  transfers.removeByGroupId.mockResolvedValue(2);
});

describe("createTransfer", () => {
  it("writes both legs with one group identifier", async () => {
    await createTransfer(OWNER, input, IN_BYN);

    const legs = createdLegs();

    expect(legs).toHaveLength(2);
    expect(legs[0]).toMatchObject({
      type: "TRANSFER_OUT",
      walletId: "wal_1",
      amount: 30_000,
    });
    expect(legs[1]).toMatchObject({
      type: "TRANSFER_IN",
      walletId: "wal_2",
      amount: 30_000,
    });
    expect(legs[0].transferGroupId).toBe(legs[1].transferGroupId);
  });

  it("leaves both legs without a category so statistics skip them", async () => {
    await createTransfer(OWNER, input, IN_BYN);

    for (const leg of createdLegs()) {
      expect(leg).not.toHaveProperty("categoryId");
    }
  });

  it("keeps the sum of both balances unchanged", async () => {
    await createTransfer(OWNER, input, IN_BYN);

    const [outgoing, incoming] = createdLegs();
    const source = computeBalance(100_000, [
      { walletId: "wal_1", type: outgoing.type, total: outgoing.amount },
    ]);
    const target = computeBalance(0, [
      { walletId: "wal_2", type: incoming.type, total: incoming.amount },
    ]);

    expect(source + target).toBe(100_000);
  });

  it("refuses a transfer onto the same wallet", async () => {
    await expect(
      createTransfer(OWNER, { ...input, toWalletId: "wal_1" }, IN_BYN),
    ).rejects.toThrow(SameWalletTransferError);
    expect(transfers.createPair).not.toHaveBeenCalled();
  });

  it("refuses a date in the future", async () => {
    await expect(
      createTransfer(
        OWNER,
        { ...input, occurredAt: new Date("2026-08-20T09:00:00.000Z") },
        IN_BYN,
      ),
    ).rejects.toThrow(FutureDateError);
    expect(transfers.createPair).not.toHaveBeenCalled();
  });

  it("refuses a wallet of another user", async () => {
    walletsByCurrency(
      walletFixture(),
      walletFixture({ id: "wal_2", userId: STRANGER }),
    );

    await expect(createTransfer(OWNER, input, IN_BYN)).rejects.toThrow(
      NotFoundError,
    );
    expect(transfers.createPair).not.toHaveBeenCalled();
  });

  it("mirrors the amount when both wallets share a currency", async () => {
    await createTransfer(OWNER, input, IN_BYN);

    const [outgoing, incoming] = createdLegs();

    expect(incoming.amount).toBe(outgoing.amount);
  });

  it("refuses a second amount that contradicts the first in one currency", async () => {
    await expect(
      createTransfer(OWNER, { ...input, amountTo: 29_000 }, IN_BYN),
    ).rejects.toThrow(ValidationFailedError);
    expect(transfers.createPair).not.toHaveBeenCalled();
  });

  it("demands the second amount when the currencies differ", async () => {
    walletsByCurrency(
      walletFixture(),
      walletFixture({ id: "wal_2", currency: "USD" }),
    );
    rates.findLatestOnOrBefore.mockResolvedValue({
      date: new Date("2026-08-18T00:00:00.000Z"),
      rate: { toFixed: () => "3.24560000" },
    });

    await expect(createTransfer(OWNER, input, IN_BYN)).rejects.toThrow(
      ValidationFailedError,
    );
    expect(transfers.createPair).not.toHaveBeenCalled();
  });

  it("stores each leg in its own currency with its own reporting amount", async () => {
    walletsByCurrency(
      walletFixture(),
      walletFixture({ id: "wal_2", currency: "USD" }),
    );
    rates.findLatestOnOrBefore.mockResolvedValue({
      date: new Date("2026-08-18T00:00:00.000Z"),
      rate: { toFixed: () => "3.00000000" },
    });

    const transfer = await createTransfer(
      OWNER,
      { ...input, amountTo: 10_000 },
      IN_BYN,
    );

    const [outgoing, incoming] = createdLegs();

    expect(outgoing).toMatchObject({
      currency: "BYN",
      amount: 30_000,
      baseAmount: 30_000,
      rate: "1.00000000",
    });
    expect(incoming).toMatchObject({
      currency: "USD",
      amount: 10_000,
      baseAmount: 30_000,
      rate: "3.00000000",
    });
    expect(transfer.rate).toBe("0.33333333");
  });

  it("refuses to store a leg it cannot convert", async () => {
    walletsByCurrency(
      walletFixture({ currency: "USD" }),
      walletFixture({ id: "wal_2", currency: "USD" }),
    );

    await expect(createTransfer(OWNER, input, IN_BYN)).rejects.toThrow(
      RateNotAvailableError,
    );
    expect(transfers.createPair).not.toHaveBeenCalled();
  });
});

describe("transferRate", () => {
  const side = (amount: number, currency: string) =>
    ({
      walletId: "wal",
      walletName: "Счёт",
      amount,
      currency,
      baseAmount: amount,
    }) as never;

  it("is the ratio of the two amounts", () => {
    expect(transferRate(side(10_000, "USD"), side(32_456, "BYN"))).toBe(
      "3.24560000",
    );
  });

  it("is absent when the currencies match", () => {
    expect(transferRate(side(10_000, "BYN"), side(10_000, "BYN"))).toBeNull();
  });
});

describe("getTransfer and deleteTransfer", () => {
  function group(): TransactionRecord[] {
    return [
      legRecord({
        userId: OWNER,
        walletId: "wal_1",
        type: "TRANSFER_OUT",
        amount: 30_000,
        currency: "BYN",
        baseAmount: 30_000,
        rate: "1.00000000",
        rateDate: OCCURRED,
        occurredAt: OCCURRED,
        note: "На накопительный",
        transferGroupId: GROUP,
      }),
      legRecord({
        userId: OWNER,
        walletId: "wal_2",
        type: "TRANSFER_IN",
        amount: 30_000,
        currency: "BYN",
        baseAmount: 30_000,
        rate: "1.00000000",
        rateDate: OCCURRED,
        occurredAt: OCCURRED,
        note: "На накопительный",
        transferGroupId: GROUP,
      }),
    ];
  }

  it("reports both sides of the pair", async () => {
    transfers.findByGroupId.mockResolvedValue(group());

    const transfer = await getTransfer(OWNER, GROUP, IN_BYN);

    expect(transfer.from.walletId).toBe("wal_1");
    expect(transfer.to.walletId).toBe("wal_2");
    expect(transfer.groupId).toBe(GROUP);
  });

  it("removes both records at once", async () => {
    transfers.findByGroupId.mockResolvedValue(group());

    await deleteTransfer(OWNER, GROUP);

    expect(transfers.removeByGroupId).toHaveBeenCalledWith(GROUP);
  });

  it("refuses a group of another user and removes nothing", async () => {
    transfers.findByGroupId.mockResolvedValue(group());

    await expect(deleteTransfer(STRANGER, GROUP)).rejects.toThrow(
      NotFoundError,
    );
    expect(transfers.removeByGroupId).not.toHaveBeenCalled();
  });

  it("refuses a group that does not exist", async () => {
    await expect(getTransfer(OWNER, GROUP, IN_BYN)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("refuses a half-written group", async () => {
    transfers.findByGroupId.mockResolvedValue([group()[0]]);

    await expect(getTransfer(OWNER, GROUP, IN_BYN)).rejects.toThrow(
      NotFoundError,
    );
  });
});
