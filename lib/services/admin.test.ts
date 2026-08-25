import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ForbiddenError,
  NotFoundError,
  SelfModificationForbiddenError,
} from "@/lib/errors";
import type { User } from "@/lib/generated/prisma/client";
import type { UserWithActivity } from "@/lib/repositories/user";
import {
  countByDay,
  getStats,
  listAccounts,
  refreshRatesNow,
  updateAccount,
} from "@/lib/services/admin";
import type { AuthenticatedUser } from "@/lib/services/auth";

const repository = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  listAll: vi.fn(),
  countAll: vi.fn(),
  update: vi.fn(),
  countTransactions: vi.fn(),
  listRegistrations: vi.fn(),
}));

const rates = vi.hoisted(() => ({ refreshRates: vi.fn() }));

vi.mock("@/lib/repositories/user", () => ({ userRepository: repository }));
vi.mock("@/lib/services/exchange-rate", () => rates);

function userFixture(overrides: Partial<User> = {}): User {
  return {
    id: "usr_2",
    email: "boris@example.com",
    passwordHash: "hash",
    name: "Борис",
    role: "USER",
    baseCurrency: "BYN",
    locale: "ru",
    isBlocked: false,
    createdAt: new Date("2026-02-01T10:00:00Z"),
    updatedAt: new Date("2026-02-01T10:00:00Z"),
    ...overrides,
  };
}

function withActivity(
  transactions: number,
  overrides: Partial<User> = {},
): UserWithActivity {
  return { ...userFixture(overrides), _count: { transactions } };
}

function actor(
  role: AuthenticatedUser["role"],
  id = "usr_1",
): AuthenticatedUser {
  return {
    id,
    email: "admin@example.com",
    name: "Анна",
    role,
    baseCurrency: "BYN",
    locale: "ru",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listAccounts", () => {
  it("returns account metadata with the transaction count", async () => {
    repository.listAll.mockResolvedValue([withActivity(12)]);
    repository.countAll.mockResolvedValue(1);

    const { items, total } = await listAccounts(actor("ADMIN"));

    expect(total).toBe(1);
    expect(items).toEqual([
      {
        id: "usr_2",
        email: "boris@example.com",
        name: "Борис",
        role: "USER",
        isBlocked: false,
        createdAt: new Date("2026-02-01T10:00:00Z"),
        transactionCount: 12,
      },
    ]);
  });

  it("never exposes financial data or the password hash", async () => {
    repository.listAll.mockResolvedValue([withActivity(3)]);
    repository.countAll.mockResolvedValue(1);

    const { items } = await listAccounts(actor("ADMIN"));

    expect(Object.keys(items[0]).sort()).toEqual([
      "createdAt",
      "email",
      "id",
      "isBlocked",
      "name",
      "role",
      "transactionCount",
    ]);
  });

  it("rejects the USER role before reading anything", async () => {
    await expect(listAccounts(actor("USER"))).rejects.toThrow(ForbiddenError);
    expect(repository.listAll).not.toHaveBeenCalled();
  });

  it("passes the page window to the repository", async () => {
    repository.listAll.mockResolvedValue([]);
    repository.countAll.mockResolvedValue(0);

    await listAccounts(actor("ADMIN"), { q: "boris" }, { page: 3, pageSize: 20 });

    expect(repository.listAll).toHaveBeenCalledWith(
      { q: "boris" },
      { skip: 40, take: 20 },
    );
  });
});

describe("updateAccount", () => {
  it("blocks an account", async () => {
    repository.findById.mockResolvedValue(userFixture());
    repository.update.mockResolvedValue(userFixture({ isBlocked: true }));

    const account = await updateAccount(actor("ADMIN"), "usr_2", {
      isBlocked: true,
    });

    expect(repository.update).toHaveBeenCalledWith("usr_2", { isBlocked: true });
    expect(account.isBlocked).toBe(true);
  });

  it("changes the role", async () => {
    repository.findById.mockResolvedValue(userFixture());
    repository.update.mockResolvedValue(userFixture({ role: "ADMIN" }));

    const account = await updateAccount(actor("ADMIN"), "usr_2", {
      role: "ADMIN",
    });

    expect(account.role).toBe("ADMIN");
  });

  it("refuses to modify the administrator's own account", async () => {
    await expect(
      updateAccount(actor("ADMIN"), "usr_1", { isBlocked: true }),
    ).rejects.toThrow(SelfModificationForbiddenError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("refuses a self role change as well as a self block", async () => {
    await expect(
      updateAccount(actor("ADMIN"), "usr_1", { role: "USER" }),
    ).rejects.toThrow(SelfModificationForbiddenError);
  });

  it("rejects an unknown account", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      updateAccount(actor("ADMIN"), "usr_gone", { isBlocked: true }),
    ).rejects.toThrow(NotFoundError);
  });

  it("rejects the USER role before writing anything", async () => {
    await expect(
      updateAccount(actor("USER"), "usr_2", { isBlocked: true }),
    ).rejects.toThrow(ForbiddenError);
    expect(repository.findById).not.toHaveBeenCalled();
  });
});

describe("countByDay", () => {
  it("fills days without registrations with zero", () => {
    const points = countByDay(
      [new Date("2026-02-03T09:00:00"), new Date("2026-02-03T21:00:00")],
      new Date("2026-02-01T00:00:00"),
      new Date("2026-02-04T23:59:59"),
    );

    expect(points).toEqual([
      { date: "2026-02-01", count: 0 },
      { date: "2026-02-02", count: 0 },
      { date: "2026-02-03", count: 2 },
      { date: "2026-02-04", count: 0 },
    ]);
  });
});

describe("getStats", () => {
  it("reports aggregates over the whole system", async () => {
    repository.countAll.mockResolvedValue(7);
    repository.countTransactions.mockResolvedValue(340);
    repository.listRegistrations.mockResolvedValue([
      new Date("2026-02-10T12:00:00"),
    ]);

    const stats = await getStats(actor("ADMIN"), new Date("2026-02-11T15:00:00"), 3);

    expect(stats.userCount).toBe(7);
    expect(stats.transactionCount).toBe(340);
    expect(stats.registrations).toEqual([
      { date: "2026-02-09", count: 0 },
      { date: "2026-02-10", count: 1 },
      { date: "2026-02-11", count: 0 },
    ]);
  });

  it("rejects the USER role", async () => {
    await expect(getStats(actor("USER"), new Date())).rejects.toThrow(
      ForbiddenError,
    );
    expect(repository.countTransactions).not.toHaveBeenCalled();
  });
});

describe("refreshRatesNow", () => {
  it("refreshes the rates for the current day", async () => {
    rates.refreshRates.mockResolvedValue({ dates: 1, rates: 4 });
    const now = new Date("2026-02-11T15:00:00");

    await expect(refreshRatesNow(actor("ADMIN"), now)).resolves.toEqual({
      dates: 1,
      rates: 4,
    });
    expect(rates.refreshRates).toHaveBeenCalledWith({ from: now, to: now });
  });

  it("rejects the USER role", async () => {
    await expect(refreshRatesNow(actor("USER"), new Date())).rejects.toThrow(
      ForbiddenError,
    );
    expect(rates.refreshRates).not.toHaveBeenCalled();
  });
});
