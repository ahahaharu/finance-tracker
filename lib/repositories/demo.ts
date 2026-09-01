import { prisma } from "@/lib/db";
import type { DemoAccount, DemoData, DemoRate } from "@/lib/services/demo";

export type DemoCounts = {
  users: number;
  categories: number;
  wallets: number;
  transactions: number;
  budgets: number;
  rates: number;
};

export type DemoRepository = {
  listRates(from: Date, to: Date): Promise<DemoRate[]>;
  replace(data: DemoData): Promise<DemoCounts>;
};

type Client = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function createAccount(
  tx: Client,
  account: DemoAccount,
): Promise<DemoCounts> {
  const user = await tx.user.create({
    data: {
      email: account.email,
      passwordHash: account.passwordHash,
      name: account.name,
      role: account.role,
      baseCurrency: account.baseCurrency,
      locale: account.locale,
    },
  });

  await tx.category.createMany({
    data: account.categories.map((category) => ({
      ...category,
      userId: user.id,
      isDefault: true,
    })),
  });

  await tx.wallet.createMany({
    data: account.wallets.map((wallet) => ({
      userId: user.id,
      name: wallet.name,
      type: wallet.type,
      currency: wallet.currency,
      initialBalance: wallet.initialBalance,
    })),
  });

  const [categories, wallets] = await Promise.all([
    tx.category.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, kind: true },
    }),
    tx.wallet.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
    }),
  ]);

  const categoryIds = new Map(
    categories.map((category) => [
      `${category.kind}:${category.name}`,
      category.id,
    ]),
  );
  const walletIds = new Map(
    account.wallets.map((wallet) => [
      wallet.key,
      wallets.find((row) => row.name === wallet.name)?.id ?? "",
    ]),
  );

  await tx.transaction.createMany({
    data: account.entries.map((entry) => ({
      userId: user.id,
      walletId: walletIds.get(entry.walletKey) ?? "",
      categoryId: entry.categoryKey
        ? (categoryIds.get(entry.categoryKey) ?? null)
        : null,
      type: entry.type,
      amount: entry.amount,
      currency: entry.currency,
      baseAmount: entry.baseAmount,
      rate: entry.rate,
      rateDate: entry.rateDate,
      occurredAt: entry.occurredAt,
      note: entry.note,
      transferGroupId: entry.transferGroupId,
    })),
  });

  await tx.budget.createMany({
    data: account.budgets.map((budget) => ({
      userId: user.id,
      categoryId: categoryIds.get(budget.categoryKey) ?? "",
      limitAmount: budget.limitAmount,
      currency: budget.currency,
      month: budget.month,
    })),
  });

  return {
    users: 1,
    categories: account.categories.length,
    wallets: account.wallets.length,
    transactions: account.entries.length,
    budgets: account.budgets.length,
    rates: 0,
  };
}

export const demoRepository: DemoRepository = {
  async listRates(from, to) {
    const rows = await prisma.exchangeRate.findMany({
      where: { toCurrency: "BYN", date: { gte: from, lte: to } },
      orderBy: { date: "asc" },
    });

    return rows.map((row) => ({
      date: row.date,
      fromCurrency: row.fromCurrency,
      rate: row.rate.toFixed(8),
    }));
  },

  replace(data) {
    return prisma.$transaction(
      async (tx) => {
        await tx.user.deleteMany({
          where: {
            email: { in: data.accounts.map((account) => account.email) },
          },
        });

        const { count } = await tx.exchangeRate.createMany({
          data: data.rates.map((rate) => ({
            date: rate.date,
            fromCurrency: rate.fromCurrency,
            toCurrency: "BYN" as const,
            rate: rate.rate,
          })),
          skipDuplicates: true,
        });

        const counts: DemoCounts = {
          users: 0,
          categories: 0,
          wallets: 0,
          transactions: 0,
          budgets: 0,
          rates: count,
        };

        for (const account of data.accounts) {
          const added = await createAccount(tx, account);

          counts.users += added.users;
          counts.categories += added.categories;
          counts.wallets += added.wallets;
          counts.transactions += added.transactions;
          counts.budgets += added.budgets;
        }

        return counts;
      },
      { timeout: 60_000 },
    );
  },
};
