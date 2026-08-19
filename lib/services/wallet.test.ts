import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  NotFoundError,
  WalletHasTransactionsError,
  WalletNameTakenError,
} from "@/lib/errors";
import type { Wallet } from "@/lib/generated/prisma/client";
import type { WalletMovement } from "@/lib/repositories/wallet";
import {
  computeBalance,
  createWallet,
  deleteWallet,
  getWallet,
  listWallets,
  updateWallet,
} from "@/lib/services/wallet";

const repository = vi.hoisted(() => ({
  listByUser: vi.fn(),
  countByUser: vi.fn(),
  findById: vi.fn(),
  findByName: vi.fn(),
  sumAmountsByType: vi.fn(),
  countTransactions: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/lib/repositories/wallet", () => ({ walletRepository: repository }));

const OWNER = "usr_1";
const STRANGER = "usr_2";

function walletFixture(overrides: Partial<Wallet> = {}): Wallet {
  return {
    id: "wal_1",
    userId: OWNER,
    name: "Наличные",
    type: "CASH",
    currency: "BYN",
    initialBalance: 10_000,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function movement(
  type: WalletMovement["type"],
  total: number,
  walletId = "wal_1",
): WalletMovement {
  return { walletId, type, total };
}

beforeEach(() => {
  vi.clearAllMocks();
  repository.listByUser.mockResolvedValue([walletFixture()]);
  repository.countByUser.mockResolvedValue(1);
  repository.findById.mockResolvedValue(walletFixture());
  repository.findByName.mockResolvedValue(null);
  repository.sumAmountsByType.mockResolvedValue([]);
  repository.countTransactions.mockResolvedValue(0);
  repository.create.mockImplementation((data: Wallet) =>
    Promise.resolve(walletFixture(data)),
  );
  repository.update.mockImplementation((id: string, changes: Partial<Wallet>) =>
    Promise.resolve(walletFixture({ id, ...changes })),
  );
});

describe("computeBalance", () => {
  it("adds incoming and subtracts outgoing movements", () => {
    const balance = computeBalance(10_000, [
      movement("INCOME", 250_000),
      movement("EXPENSE", 80_000),
      movement("TRANSFER_IN", 5_000),
      movement("TRANSFER_OUT", 15_000),
    ]);

    expect(balance).toBe(170_000);
  });

  it("returns the initial balance when there are no transactions", () => {
    expect(computeBalance(-2_500, [])).toBe(-2_500);
  });
});

describe("listWallets", () => {
  it("computes the current balance of every wallet from its own movements", async () => {
    repository.listByUser.mockResolvedValue([
      walletFixture(),
      walletFixture({ id: "wal_2", name: "Карта", initialBalance: 0 }),
    ]);
    repository.countByUser.mockResolvedValue(2);
    repository.sumAmountsByType.mockResolvedValue([
      movement("INCOME", 40_000),
      movement("EXPENSE", 15_000, "wal_2"),
    ]);

    const { items, total } = await listWallets(OWNER);

    expect(total).toBe(2);
    expect(items.map((wallet) => wallet.currentBalance)).toEqual([
      50_000,
      -15_000,
    ]);
  });

  it("asks the repository only for the wallets of the given user", async () => {
    await listWallets(OWNER);

    expect(repository.listByUser).toHaveBeenCalledWith(OWNER, undefined);
  });

  it("translates a page into skip and take", async () => {
    await listWallets(OWNER, { page: 3, pageSize: 20 });

    expect(repository.listByUser).toHaveBeenCalledWith(OWNER, {
      skip: 40,
      take: 20,
    });
  });
});

describe("getWallet", () => {
  it("returns the wallet with its current balance", async () => {
    repository.sumAmountsByType.mockResolvedValue([movement("INCOME", 1_000)]);

    const wallet = await getWallet(OWNER, "wal_1");

    expect(wallet.currentBalance).toBe(11_000);
  });

  it("rejects a wallet owned by another user", async () => {
    await expect(getWallet(STRANGER, "wal_1")).rejects.toThrow(NotFoundError);
  });

  it("rejects a wallet that does not exist", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(getWallet(OWNER, "wal_1")).rejects.toThrow(NotFoundError);
  });
});

describe("createWallet", () => {
  const input = {
    name: "Накопления",
    type: "SAVINGS",
    currency: "USD",
    initialBalance: 100_000,
  } as const;

  it("stores the wallet for the given user", async () => {
    await createWallet(OWNER, input);

    expect(repository.create).toHaveBeenCalledWith({ userId: OWNER, ...input });
  });

  it("rejects a name already used by the same user", async () => {
    repository.findByName.mockResolvedValue(walletFixture({ id: "wal_9" }));

    await expect(createWallet(OWNER, input)).rejects.toThrow(
      WalletNameTakenError,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("reports the initial balance as the current one", async () => {
    const wallet = await createWallet(OWNER, input);

    expect(wallet.currentBalance).toBe(100_000);
  });
});

describe("updateWallet", () => {
  const changes = {
    name: "Карта",
    type: "CARD",
    initialBalance: 20_000,
  } as const;

  it("rejects a wallet owned by another user", async () => {
    await expect(updateWallet(STRANGER, "wal_1", changes)).rejects.toThrow(
      NotFoundError,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("keeps the name when it belongs to the wallet being updated", async () => {
    repository.findByName.mockResolvedValue(walletFixture({ name: "Карта" }));

    await expect(updateWallet(OWNER, "wal_1", changes)).resolves.toMatchObject({
      name: "Карта",
    });
  });

  it("rejects a name already used by another wallet", async () => {
    repository.findByName.mockResolvedValue(
      walletFixture({ id: "wal_2", name: "Карта" }),
    );

    await expect(updateWallet(OWNER, "wal_1", changes)).rejects.toThrow(
      WalletNameTakenError,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("keeps the fields left out of a partial change", async () => {
    await updateWallet(OWNER, "wal_1", { initialBalance: 500 });

    expect(repository.update).toHaveBeenCalledWith("wal_1", {
      name: "Наличные",
      type: "CASH",
      initialBalance: 500,
    });
    expect(repository.findByName).not.toHaveBeenCalled();
  });

  it("recomputes the balance from the new initial balance", async () => {
    repository.sumAmountsByType.mockResolvedValue([movement("EXPENSE", 5_000)]);

    const wallet = await updateWallet(OWNER, "wal_1", changes);

    expect(wallet.currentBalance).toBe(15_000);
  });
});

describe("deleteWallet", () => {
  it("removes a wallet without transactions", async () => {
    await deleteWallet(OWNER, "wal_1");

    expect(repository.remove).toHaveBeenCalledWith("wal_1");
  });

  it("refuses to remove a wallet with transactions and reports their count", async () => {
    repository.countTransactions.mockResolvedValue(340);

    await expect(deleteWallet(OWNER, "wal_1")).rejects.toMatchObject({
      code: "WALLET_HAS_TRANSACTIONS",
      details: { transactionCount: 340 },
    });
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it("throws a typed domain error for a wallet with transactions", async () => {
    repository.countTransactions.mockResolvedValue(1);

    await expect(deleteWallet(OWNER, "wal_1")).rejects.toThrow(
      WalletHasTransactionsError,
    );
  });

  it("rejects a wallet owned by another user", async () => {
    await expect(deleteWallet(STRANGER, "wal_1")).rejects.toThrow(NotFoundError);
    expect(repository.remove).not.toHaveBeenCalled();
  });
});
