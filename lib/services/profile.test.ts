import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  InvalidCredentialsError,
  NotFoundError,
  RateNotAvailableError,
} from "@/lib/errors";
import type { User } from "@/lib/generated/prisma/client";
import {
  changePassword,
  getProfile,
  updateProfile,
} from "@/lib/services/profile";

const users = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  listAll: vi.fn(),
  countAll: vi.fn(),
  update: vi.fn(),
  updateProfile: vi.fn(),
  updatePassword: vi.fn(),
  countTransactions: vi.fn(),
  listRegistrations: vi.fn(),
}));

const profiles = vi.hoisted(() => ({
  listTransactionsToRebase: vi.fn(),
  listBudgetsToRebase: vi.fn(),
  applyBaseCurrency: vi.fn(),
}));

const rates = vi.hoisted(() => ({ findConversion: vi.fn() }));

const bcrypt = vi.hoisted(() => ({
  compare: vi.fn(),
  hash: vi.fn(async () => "new-hash"),
}));

vi.mock("@/lib/repositories/user", () => ({ userRepository: users }));
vi.mock("@/lib/repositories/profile", () => ({ profileRepository: profiles }));
vi.mock("bcryptjs", () => bcrypt);
vi.mock("@/lib/services/exchange-rate", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/exchange-rate")>()),
  findConversion: rates.findConversion,
}));

function userFixture(overrides: Partial<User> = {}): User {
  return {
    id: "usr_1",
    email: "anna@example.com",
    passwordHash: "old-hash",
    name: "Анна",
    role: "USER",
    baseCurrency: "BYN",
    locale: "ru",
    isBlocked: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  users.findById.mockResolvedValue(userFixture());
  profiles.listTransactionsToRebase.mockResolvedValue([]);
  profiles.listBudgetsToRebase.mockResolvedValue([]);
  profiles.applyBaseCurrency.mockImplementation(async ({ baseCurrency }) =>
    userFixture({ baseCurrency }),
  );
  users.updateProfile.mockImplementation(async (_id, changes) =>
    userFixture(changes),
  );
});

describe("getProfile", () => {
  it("never exposes the password hash", async () => {
    await expect(getProfile("usr_1")).resolves.toEqual({
      id: "usr_1",
      email: "anna@example.com",
      name: "Анна",
      role: "USER",
      baseCurrency: "BYN",
      locale: "ru",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
  });

  it("rejects a missing user", async () => {
    users.findById.mockResolvedValue(null);

    await expect(getProfile("usr_gone")).rejects.toThrow(NotFoundError);
  });
});

describe("updateProfile", () => {
  it("changes the name without touching money", async () => {
    await updateProfile("usr_1", { name: "Анна Б." });

    expect(users.updateProfile).toHaveBeenCalledWith("usr_1", {
      name: "Анна Б.",
      locale: undefined,
    });
    expect(profiles.applyBaseCurrency).not.toHaveBeenCalled();
  });

  it("writes nothing when the same base currency is chosen again", async () => {
    const profile = await updateProfile("usr_1", { baseCurrency: "BYN" });

    expect(profile.baseCurrency).toBe("BYN");
    expect(profiles.listTransactionsToRebase).not.toHaveBeenCalled();
    expect(profiles.applyBaseCurrency).not.toHaveBeenCalled();
    expect(users.updateProfile).not.toHaveBeenCalled();
  });

  it("recalculates each transaction at the rate of its own date", async () => {
    profiles.listTransactionsToRebase.mockResolvedValue([
      {
        id: "trx_march",
        amount: 10000,
        currency: "BYN",
        rateDate: new Date("2026-03-10T00:00:00Z"),
      },
      {
        id: "trx_august",
        amount: 10000,
        currency: "BYN",
        rateDate: new Date("2026-08-10T00:00:00Z"),
      },
    ]);
    rates.findConversion.mockImplementation(async ({ on }) =>
      on.getTime() === new Date("2026-03-10T00:00:00Z").getTime()
        ? { rate: "0.30000000", rateDate: new Date("2026-03-10T00:00:00Z") }
        : { rate: "0.40000000", rateDate: new Date("2026-08-10T00:00:00Z") },
    );

    await updateProfile("usr_1", { baseCurrency: "USD" });

    const { transactions } = profiles.applyBaseCurrency.mock.calls[0][0];

    expect(transactions).toEqual([
      {
        id: "trx_march",
        rate: "0.30000000",
        rateDate: new Date("2026-03-10T00:00:00Z"),
        baseAmount: 3000,
      },
      {
        id: "trx_august",
        rate: "0.40000000",
        rateDate: new Date("2026-08-10T00:00:00Z"),
        baseAmount: 4000,
      },
    ]);
  });

  it("converts a budget at the rate of the first day of its month", async () => {
    profiles.listBudgetsToRebase.mockResolvedValue([
      {
        id: "bdg_1",
        limitAmount: 40000,
        currency: "BYN",
        month: new Date("2026-04-01T00:00:00Z"),
      },
    ]);
    rates.findConversion.mockResolvedValue({
      rate: "0.30000000",
      rateDate: new Date("2026-04-01T00:00:00Z"),
    });

    await updateProfile("usr_1", { baseCurrency: "USD" });

    const call = profiles.applyBaseCurrency.mock.calls[0][0];

    expect(rates.findConversion).toHaveBeenCalledWith({
      from: "BYN",
      to: "USD",
      on: new Date("2026-04-01T00:00:00Z"),
    });
    expect(call.budgets).toEqual([
      { id: "bdg_1", currency: "USD", limitAmount: 12000 },
    ]);
  });

  it("asks for one rate per currency and date, not per row", async () => {
    profiles.listTransactionsToRebase.mockResolvedValue([
      { id: "a", amount: 100, currency: "BYN", rateDate: new Date("2026-03-10T00:00:00Z") },
      { id: "b", amount: 200, currency: "BYN", rateDate: new Date("2026-03-10T00:00:00Z") },
      { id: "c", amount: 300, currency: "EUR", rateDate: new Date("2026-03-10T00:00:00Z") },
    ]);
    rates.findConversion.mockResolvedValue({
      rate: "1.00000000",
      rateDate: new Date("2026-03-10T00:00:00Z"),
    });

    await updateProfile("usr_1", { baseCurrency: "USD" });

    expect(rates.findConversion).toHaveBeenCalledTimes(2);
  });

  it("rolls back by writing nothing when a rate is missing", async () => {
    profiles.listTransactionsToRebase.mockResolvedValue([
      { id: "a", amount: 100, currency: "BYN", rateDate: new Date("2020-01-01T00:00:00Z") },
    ]);
    rates.findConversion.mockResolvedValue(null);

    await expect(
      updateProfile("usr_1", { baseCurrency: "USD" }),
    ).rejects.toThrow(RateNotAvailableError);
    expect(profiles.applyBaseCurrency).not.toHaveBeenCalled();
  });

  it("keeps the sign of a negative amount through conversion", async () => {
    profiles.listTransactionsToRebase.mockResolvedValue([
      { id: "a", amount: -2345, currency: "BYN", rateDate: new Date("2026-03-10T00:00:00Z") },
    ]);
    rates.findConversion.mockResolvedValue({
      rate: "1.00000000",
      rateDate: new Date("2026-03-10T00:00:00Z"),
    });

    await updateProfile("usr_1", { baseCurrency: "USD" });

    const { transactions } = profiles.applyBaseCurrency.mock.calls[0][0];

    expect(transactions[0].baseAmount).toBe(-2345);
  });

  it("carries the name and locale through the same transaction as the rebase", async () => {
    await updateProfile("usr_1", {
      baseCurrency: "EUR",
      name: "Анна Б.",
      locale: "en",
    });

    expect(profiles.applyBaseCurrency).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "usr_1",
        baseCurrency: "EUR",
        name: "Анна Б.",
        locale: "en",
      }),
    );
    expect(users.updateProfile).not.toHaveBeenCalled();
  });
});

describe("changePassword", () => {
  it("stores a fresh hash once the current password matches", async () => {
    bcrypt.compare.mockResolvedValue(true);

    await changePassword("usr_1", {
      currentPassword: "old-secret-1",
      newPassword: "new-secret-2",
    });

    expect(bcrypt.compare).toHaveBeenCalledWith("old-secret-1", "old-hash");
    expect(users.updatePassword).toHaveBeenCalledWith("usr_1", "new-hash");
  });

  it("rejects a wrong current password without writing", async () => {
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      changePassword("usr_1", {
        currentPassword: "wrong",
        newPassword: "new-secret-2",
      }),
    ).rejects.toThrow(InvalidCredentialsError);
    expect(users.updatePassword).not.toHaveBeenCalled();
  });
});
