import { getDaysInMonth, startOfMonth, subMonths } from "date-fns";
import { describe, expect, it, vi } from "vitest";

import {
  ADMIN_EMAIL,
  type DemoAccount,
  type DemoEntry,
  HISTORY_MONTHS,
  MAX_MONTH_ENTRIES,
  MIN_MONTH_ENTRIES,
  USER_EMAIL,
  buildDemoData,
  categoryKey,
  demoRange,
} from "@/lib/services/demo";
import { applyRate, isoDate, parseRate } from "@/lib/services/exchange-rate";

vi.mock("@/lib/repositories/exchange-rate", () => ({
  exchangeRateRepository: {
    findLatestOnOrBefore: vi.fn(),
    listLatestOnOrBefore: vi.fn(),
    saveMany: vi.fn(),
  },
}));

const NOW = new Date(2026, 8, 17, 14, 30);
const PASSWORD_HASH = "$2a$10$hash";

function build(now = NOW, knownRates: Parameters<typeof buildDemoData>[0]["knownRates"] = []) {
  return buildDemoData({ now, passwordHash: PASSWORD_HASH, knownRates });
}

function demoUser(now = NOW): DemoAccount {
  const account = build(now).accounts.find(
    (candidate) => candidate.email === USER_EMAIL,
  );

  if (!account) {
    throw new Error("Demo user is missing");
  }

  return account;
}

function monthOf(entry: DemoEntry): string {
  return `${entry.occurredAt.getFullYear()}-${entry.occurredAt.getMonth()}`;
}

function spentOn(account: DemoAccount, key: string, month: Date): number {
  return account.entries
    .filter(
      (entry) =>
        entry.type === "EXPENSE" &&
        entry.categoryKey === key &&
        entry.occurredAt >= month,
    )
    .reduce((total, entry) => total + entry.baseAmount, 0);
}

describe("buildDemoData", () => {
  it("creates an administrator without financial data and a user with three wallets", () => {
    const { accounts } = build();

    expect(accounts).toHaveLength(2);

    const admin = accounts.find((account) => account.email === ADMIN_EMAIL);

    expect(admin?.role).toBe("ADMIN");
    expect(admin?.wallets).toHaveLength(0);
    expect(admin?.entries).toHaveLength(0);
    expect(admin?.budgets).toHaveLength(0);

    const user = demoUser();

    expect(user.role).toBe("USER");
    expect(user.wallets.map((wallet) => wallet.currency)).toEqual([
      "BYN",
      "BYN",
      "USD",
    ]);
  });

  it("repeats the same data for the same moment", () => {
    expect(build()).toEqual(build());
  });

  it("keeps every entry inside the last twelve months and out of the future", () => {
    const user = demoUser();
    const { from } = demoRange(NOW);
    const months = new Set(user.entries.map(monthOf));

    expect(months.size).toBe(HISTORY_MONTHS);

    for (const entry of user.entries) {
      expect(entry.occurredAt.getTime()).toBeGreaterThanOrEqual(from.getTime());
      expect(entry.occurredAt.getTime()).toBeLessThanOrEqual(NOW.getTime());
    }
  });

  it("records fifteen to forty entries in every complete month", () => {
    const user = demoUser();
    const current = `${NOW.getFullYear()}-${NOW.getMonth()}`;
    const counts = new Map<string, number>();

    for (const entry of user.entries) {
      if (entry.transferGroupId) {
        continue;
      }

      const month = monthOf(entry);

      counts.set(month, (counts.get(month) ?? 0) + 1);
    }

    counts.delete(current);

    expect(counts.size).toBe(HISTORY_MONTHS - 1);

    for (const count of counts.values()) {
      expect(count).toBeGreaterThanOrEqual(MIN_MONTH_ENTRIES);
      expect(count).toBeLessThanOrEqual(MAX_MONTH_ENTRIES);
    }
  });

  it("leaves amounts in the reporting currency untouched for byn wallets", () => {
    const user = demoUser();
    const byn = user.entries.filter((entry) => entry.currency === "BYN");

    expect(byn.length).toBeGreaterThan(0);

    for (const entry of byn) {
      expect(entry.rate).toBe("1.00000000");
      expect(entry.baseAmount).toBe(entry.amount);
    }
  });

  it("converts foreign amounts by the generated rate of their own date", () => {
    const data = build();
    const user = data.accounts.find(
      (account) => account.email === USER_EMAIL,
    ) as DemoAccount;
    const rates = new Map(
      data.rates
        .filter((rate) => rate.fromCurrency === "USD")
        .map((rate) => [isoDate(rate.date), rate.rate]),
    );
    const foreign = user.entries.filter((entry) => entry.currency === "USD");

    expect(foreign.length).toBeGreaterThan(0);

    for (const entry of foreign) {
      expect(entry.rate).toBe(rates.get(isoDate(entry.rateDate)));
      expect(entry.baseAmount).toBe(applyRate(entry.amount, parseRate(entry.rate)));
    }
  });

  it("writes transfers as pairs sharing a group and holding no category", () => {
    const user = demoUser();
    const groups = new Map<string, DemoEntry[]>();

    for (const entry of user.entries) {
      if (!entry.transferGroupId) {
        continue;
      }

      groups.set(entry.transferGroupId, [
        ...(groups.get(entry.transferGroupId) ?? []),
        entry,
      ]);
    }

    expect(groups.size).toBeGreaterThanOrEqual(4);
    expect(groups.size).toBeLessThanOrEqual(6);

    let crossCurrency = 0;

    for (const legs of groups.values()) {
      expect(legs).toHaveLength(2);

      const outgoing = legs.find((leg) => leg.type === "TRANSFER_OUT");
      const incoming = legs.find((leg) => leg.type === "TRANSFER_IN");

      expect(outgoing).toBeDefined();
      expect(incoming).toBeDefined();
      expect(outgoing?.walletKey).not.toBe(incoming?.walletKey);
      expect(outgoing?.categoryKey).toBeNull();
      expect(incoming?.categoryKey).toBeNull();
      expect(outgoing?.occurredAt).toEqual(incoming?.occurredAt);

      if (outgoing?.currency !== incoming?.currency) {
        crossCurrency += 1;
      }
    }

    expect(crossCurrency).toBeGreaterThan(0);
  });

  it("budgets four categories of the current month and exceeds exactly one", () => {
    const user = demoUser();
    const month = startOfMonth(NOW);

    expect(user.budgets).toHaveLength(4);

    const exceeded = user.budgets.filter(
      (budget) =>
        spentOn(user, budget.categoryKey, month) > budget.limitAmount,
    );

    expect(exceeded).toHaveLength(1);

    for (const budget of user.budgets) {
      expect(budget.currency).toBe("BYN");
      expect(budget.month).toEqual(
        new Date(Date.UTC(NOW.getFullYear(), NOW.getMonth(), 1)),
      );
      expect(budget.limitAmount).toBeGreaterThan(0);
    }
  });

  it("never drives a wallet balance below zero", () => {
    const user = demoUser();
    const balances = new Map(
      user.wallets.map((wallet) => [wallet.key, wallet.initialBalance]),
    );

    for (const entry of user.entries) {
      const incoming = entry.type === "INCOME" || entry.type === "TRANSFER_IN";
      const balance =
        (balances.get(entry.walletKey) ?? 0) +
        (incoming ? entry.amount : -entry.amount);

      expect(balance).toBeGreaterThanOrEqual(0);

      balances.set(entry.walletKey, balance);
    }
  });

  it("references only categories the account owns", () => {
    const user = demoUser();
    const owned = new Set(
      user.categories.map((category) =>
        categoryKey(category.kind, category.name),
      ),
    );

    for (const entry of user.entries) {
      if (entry.categoryKey) {
        expect(owned.has(entry.categoryKey)).toBe(true);
      }
    }

    for (const budget of user.budgets) {
      expect(owned.has(budget.categoryKey)).toBe(true);
    }
  });

  it("covers every day of the period with rates and keeps the published ones", () => {
    const { from, to } = demoRange(NOW);
    const published = {
      date: new Date(Date.UTC(NOW.getFullYear(), NOW.getMonth(), 1)),
      fromCurrency: "USD" as const,
      rate: "3.40000000",
    };
    const data = build(NOW, [published]);
    const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
    const usd = data.rates.filter((rate) => rate.fromCurrency === "USD");

    expect(data.rates).toHaveLength(days * 2 - 1);
    expect(
      usd.some((rate) => isoDate(rate.date) === isoDate(published.date)),
    ).toBe(false);

    const user = data.accounts.find(
      (account) => account.email === USER_EMAIL,
    ) as DemoAccount;
    const converted = user.entries.filter(
      (entry) =>
        entry.currency === "USD" &&
        isoDate(entry.rateDate) === isoDate(published.date),
    );

    for (const entry of converted) {
      expect(entry.rate).toBe(published.rate);
    }
  });

  it("shrinks the current month to the days already passed", () => {
    const early = new Date(2026, 8, 2, 11, 0);
    const user = demoUser(early);
    const month = startOfMonth(early);
    const current = user.entries.filter(
      (entry) => entry.occurredAt >= month && !entry.transferGroupId,
    );

    expect(current.length).toBeLessThan(MIN_MONTH_ENTRIES);
    expect(current.length).toBeGreaterThan(0);
    expect(getDaysInMonth(subMonths(early, 1))).toBeGreaterThan(0);

    for (const entry of current) {
      expect(entry.occurredAt.getTime()).toBeLessThanOrEqual(early.getTime());
    }
  });
});
