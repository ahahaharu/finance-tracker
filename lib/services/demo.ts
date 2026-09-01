import { getDaysInMonth, startOfMonth, subMonths } from "date-fns";
import type { Locale } from "next-intl";

import type {
  CategoryKind,
  Currency,
  Role,
  TransactionType,
  WalletType,
} from "@/lib/generated/prisma/enums";
import {
  type NewCategory,
  buildDefaultCategories,
} from "@/lib/services/default-categories";
import {
  RATE_UNIT,
  applyRate,
  crossRate,
  dateOnly,
  divideHalfUp,
  formatRate,
  isoDate,
  parseRate,
} from "@/lib/services/exchange-rate";

export const DEMO_PASSWORD = "demo-tracker-2026";
export const ADMIN_EMAIL = "admin@demo.local";
export const USER_EMAIL = "user@demo.local";
export const HISTORY_MONTHS = 12;
export const MIN_MONTH_ENTRIES = 15;
export const MAX_MONTH_ENTRIES = 40;
export const MIN_BUDGET_SPEND = 2000;

const DEMO_LOCALE: Locale = "ru";
const DEMO_SEED = 20260401;
const MINUTE_IN_MS = 60 * 1000;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const RATE_LOOKBACK_DAYS = 30;
const BASE_CURRENCY: Currency = "BYN";

export type DemoRate = {
  date: Date;
  fromCurrency: Currency;
  rate: string;
};

export type DemoWallet = {
  key: string;
  name: string;
  type: WalletType;
  currency: Currency;
  initialBalance: number;
};

export type DemoEntry = {
  walletKey: string;
  categoryKey: string | null;
  type: TransactionType;
  amount: number;
  currency: Currency;
  baseAmount: number;
  rate: string;
  rateDate: Date;
  occurredAt: Date;
  note: string | null;
  transferGroupId: string | null;
};

export type DemoBudget = {
  categoryKey: string;
  limitAmount: number;
  currency: Currency;
  month: Date;
};

export type DemoAccount = {
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  baseCurrency: Currency;
  locale: string;
  categories: readonly NewCategory[];
  wallets: readonly DemoWallet[];
  entries: readonly DemoEntry[];
  budgets: readonly DemoBudget[];
};

export type DemoData = {
  rates: readonly DemoRate[];
  accounts: readonly DemoAccount[];
};

export type DemoOptions = {
  now: Date;
  passwordHash: string;
  knownRates?: readonly DemoRate[];
};

type Random = () => number;

type RateSeries = Map<string, Map<Currency, bigint>>;

type RateWalk = {
  seed: number;
  start: number;
  min: number;
  max: number;
  step: number;
};

type SpendingPlan = {
  name: string;
  weight: number;
  min: number;
  max: number;
  cashChance: number;
  notes: readonly string[];
};

type TransferPlan = {
  monthsAgo: number;
  fromKey: string;
  toKey: string;
  min: number;
  max: number;
  note: string;
};

type BudgetPlan = {
  name: string;
  permille: number;
};

const rateWalks: Record<string, RateWalk> = {
  USD: { seed: 517, start: 319_000_000, min: 305_000_000, max: 352_000_000, step: 900_000 },
  EUR: { seed: 823, start: 352_000_000, min: 338_000_000, max: 388_000_000, step: 1_200_000 },
};

const demoWallets: readonly DemoWallet[] = [
  { key: "cash", name: "Наличные", type: "CASH", currency: "BYN", initialBalance: 38_000 },
  { key: "card", name: "Карта", type: "CARD", currency: "BYN", initialBalance: 156_000 },
  { key: "savings", name: "Накопительный", type: "SAVINGS", currency: "USD", initialBalance: 42_000 },
];

const spendingPlans: readonly SpendingPlan[] = [
  {
    name: "Продукты",
    weight: 10,
    min: 1_200,
    max: 9_000,
    cashChance: 6,
    notes: ["Продукты на неделю", "Гипермаркет", "Овощи и фрукты"],
  },
  {
    name: "Транспорт",
    weight: 6,
    min: 150,
    max: 1_500,
    cashChance: 14,
    notes: ["Проездной", "Такси"],
  },
  {
    name: "Кафе и рестораны",
    weight: 5,
    min: 800,
    max: 4_500,
    cashChance: 6,
    notes: ["Обед", "Кофе"],
  },
  {
    name: "Развлечения",
    weight: 3,
    min: 1_500,
    max: 7_000,
    cashChance: 4,
    notes: ["Кино", "Концерт"],
  },
  {
    name: "Здоровье",
    weight: 2,
    min: 2_000,
    max: 12_000,
    cashChance: 0,
    notes: ["Аптека", "Приём врача"],
  },
  {
    name: "Одежда",
    weight: 2,
    min: 4_000,
    max: 25_000,
    cashChance: 0,
    notes: ["Обувь", "Куртка"],
  },
  {
    name: "Образование",
    weight: 1,
    min: 6_000,
    max: 20_000,
    cashChance: 0,
    notes: ["Курс английского", "Книги"],
  },
  {
    name: "Прочее",
    weight: 2,
    min: 1_000,
    max: 5_000,
    cashChance: 8,
    notes: ["Подарок", "Бытовые мелочи"],
  },
];

const transferPlans: readonly TransferPlan[] = [
  {
    monthsAgo: 10,
    fromKey: "card",
    toKey: "savings",
    min: 30_000,
    max: 90_000,
    note: "Перевод на накопительный",
  },
  {
    monthsAgo: 8,
    fromKey: "card",
    toKey: "cash",
    min: 20_000,
    max: 50_000,
    note: "Снятие наличных",
  },
  {
    monthsAgo: 7,
    fromKey: "card",
    toKey: "savings",
    min: 30_000,
    max: 90_000,
    note: "Перевод на накопительный",
  },
  {
    monthsAgo: 4,
    fromKey: "card",
    toKey: "cash",
    min: 20_000,
    max: 50_000,
    note: "Снятие наличных",
  },
  {
    monthsAgo: 2,
    fromKey: "card",
    toKey: "savings",
    min: 30_000,
    max: 90_000,
    note: "Перевод на накопительный",
  },
];

const budgetPlans: readonly BudgetPlan[] = [
  { name: "Продукты", permille: 1_600 },
  { name: "Транспорт", permille: 2_000 },
  { name: "Кафе и рестораны", permille: 850 },
  { name: "Развлечения", permille: 1_100 },
];

function randomiser(seed: number): Random {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;

    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function between(random: Random, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function chance(random: Random, percent: number): boolean {
  return random() * 100 < percent;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function uuid(random: Random): string {
  const digits = Array.from({ length: 32 }, () =>
    Math.floor(random() * 16).toString(16),
  );

  digits[12] = "4";
  digits[16] = ((Number.parseInt(digits[16], 16) & 0x3) | 0x8).toString(16);

  const hex = digits.join("");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

export function categoryKey(kind: CategoryKind, name: string): string {
  return `${kind}:${name}`;
}

export function demoRange(now: Date): { from: Date; to: Date } {
  return {
    from: dateOnly(startOfMonth(subMonths(now, HISTORY_MONTHS - 1))),
    to: dateOnly(now),
  };
}

function buildRates(
  from: Date,
  to: Date,
  known: readonly DemoRate[],
): { fresh: DemoRate[]; series: RateSeries } {
  const stored = new Map<string, Map<Currency, bigint>>();

  for (const rate of known) {
    const key = isoDate(dateOnly(rate.date));
    const day = stored.get(key) ?? new Map<Currency, bigint>();

    day.set(rate.fromCurrency, parseRate(rate.rate));
    stored.set(key, day);
  }

  const series: RateSeries = new Map();
  const fresh: DemoRate[] = [];

  for (const [currency, walk] of Object.entries(rateWalks)) {
    const random = randomiser(walk.seed);
    let level = walk.start;
    let cursor = from;

    while (cursor <= to) {
      const key = isoDate(cursor);
      const published = stored.get(key)?.get(currency as Currency);

      if (published === undefined) {
        level = clamp(
          Math.round(level + (random() * 2 - 1) * walk.step),
          walk.min,
          walk.max,
        );

        fresh.push({
          date: cursor,
          fromCurrency: currency as Currency,
          rate: formatRate(BigInt(level)),
        });
      } else {
        level = Number(published);
      }

      const day = series.get(key) ?? new Map<Currency, bigint>();

      day.set(currency as Currency, BigInt(level));
      series.set(key, day);

      cursor = new Date(cursor.getTime() + DAY_IN_MS);
    }
  }

  return { fresh, series };
}

function rateAt(series: RateSeries, currency: Currency, on: Date): bigint {
  if (currency === BASE_CURRENCY) {
    return RATE_UNIT;
  }

  let cursor = dateOnly(on);

  for (let step = 0; step < RATE_LOOKBACK_DAYS; step += 1) {
    const value = series.get(isoDate(cursor))?.get(currency);

    if (value !== undefined) {
      return value;
    }

    cursor = new Date(cursor.getTime() - DAY_IN_MS);
  }

  throw new RangeError(`Demo rate for ${currency} on ${isoDate(on)} is missing`);
}

function walletOf(key: string): DemoWallet {
  const wallet = demoWallets.find((candidate) => candidate.key === key);

  if (!wallet) {
    throw new RangeError(`Demo wallet ${key} is not declared`);
  }

  return wallet;
}

function buildEntry({
  series,
  wallet,
  key,
  type,
  amount,
  occurredAt,
  note,
  transferGroupId,
}: {
  series: RateSeries;
  wallet: DemoWallet;
  key: string | null;
  type: TransactionType;
  amount: number;
  occurredAt: Date;
  note: string | null;
  transferGroupId?: string;
}): DemoEntry {
  const rate = crossRate(
    rateAt(series, wallet.currency, occurredAt),
    rateAt(series, BASE_CURRENCY, occurredAt),
  );

  return {
    walletKey: wallet.key,
    categoryKey: key,
    type,
    amount,
    currency: wallet.currency,
    baseAmount: applyRate(amount, rate),
    rate: formatRate(rate),
    rateDate: dateOnly(occurredAt),
    occurredAt,
    note,
    transferGroupId: transferGroupId ?? null,
  };
}

function momentIn(
  random: Random,
  month: Date,
  day: number,
  limit: Date,
): Date {
  const hour = between(random, 8, 21);
  const minute = between(random, 0, 3) * 15;
  const moment = new Date(
    month.getFullYear(),
    month.getMonth(),
    day,
    hour,
    minute,
  );

  if (moment <= limit) {
    return moment;
  }

  const earlier = new Date(
    month.getFullYear(),
    month.getMonth(),
    day,
    Math.max(0, limit.getHours() - 1),
    minute,
  );

  return earlier <= limit ? earlier : new Date(limit.getTime() - MINUTE_IN_MS);
}

function pickPlan(random: Random, plans: readonly SpendingPlan[]): SpendingPlan {
  const total = plans.reduce((sum, plan) => sum + plan.weight, 0);
  let ticket = random() * total;

  for (const plan of plans) {
    ticket -= plan.weight;

    if (ticket <= 0) {
      return plan;
    }
  }

  return plans[plans.length - 1];
}

function monthTarget(random: Random, month: Date, lastDay: number): number {
  const target = between(random, MIN_MONTH_ENTRIES, MAX_MONTH_ENTRIES);
  const days = getDaysInMonth(month);

  if (lastDay >= days) {
    return target;
  }

  return Math.max(4, Math.round((target * lastDay) / days));
}

function buildMonth(
  random: Random,
  series: RateSeries,
  month: Date,
  lastDay: number,
  now: Date,
): DemoEntry[] {
  const entries: DemoEntry[] = [];
  const card = walletOf("card");

  if (lastDay >= 5) {
    entries.push(
      buildEntry({
        series,
        wallet: card,
        key: categoryKey("INCOME", "Зарплата"),
        type: "INCOME",
        amount: between(random, 175_000, 225_000),
        occurredAt: momentIn(random, month, 5, now),
        note: "Зарплата за месяц",
      }),
    );
  }

  if (lastDay >= 10) {
    entries.push(
      buildEntry({
        series,
        wallet: card,
        key: categoryKey("EXPENSE", "Жильё"),
        type: "EXPENSE",
        amount: between(random, 38_000, 46_000),
        occurredAt: momentIn(random, month, 10, now),
        note: "Аренда и коммунальные",
      }),
    );
  }

  if (lastDay >= 12) {
    entries.push(
      buildEntry({
        series,
        wallet: card,
        key: categoryKey("EXPENSE", "Связь и интернет"),
        type: "EXPENSE",
        amount: between(random, 3_000, 4_500),
        occurredAt: momentIn(random, month, 12, now),
        note: "Мобильная связь и интернет",
      }),
    );
  }

  if (lastDay >= 6 && chance(random, 45)) {
    entries.push(
      buildEntry({
        series,
        wallet: card,
        key: categoryKey("INCOME", "Подработка"),
        type: "INCOME",
        amount: between(random, 15_000, 60_000),
        occurredAt: momentIn(random, month, between(random, 6, lastDay), now),
        note: "Подработка",
      }),
    );
  }

  const target = monthTarget(random, month, lastDay);

  while (entries.length < target) {
    const plan = pickPlan(random, spendingPlans);

    entries.push(
      buildEntry({
        series,
        wallet: walletOf(chance(random, plan.cashChance) ? "cash" : "card"),
        key: categoryKey("EXPENSE", plan.name),
        type: "EXPENSE",
        amount: between(random, plan.min, plan.max),
        occurredAt: momentIn(random, month, between(random, 1, lastDay), now),
        note: chance(random, 30)
          ? plan.notes[between(random, 0, plan.notes.length - 1)]
          : null,
      }),
    );
  }

  return entries;
}

function buildTransfers(
  random: Random,
  series: RateSeries,
  now: Date,
): DemoEntry[] {
  const entries: DemoEntry[] = [];

  for (const plan of transferPlans) {
    const from = walletOf(plan.fromKey);
    const to = walletOf(plan.toKey);
    const month = startOfMonth(subMonths(now, plan.monthsAgo));
    const occurredAt = momentIn(random, month, 20, now);
    const amountFrom = between(random, plan.min, plan.max);
    const amountTo =
      from.currency === to.currency
        ? amountFrom
        : applyRate(
            amountFrom,
            crossRate(
              rateAt(series, from.currency, occurredAt),
              rateAt(series, to.currency, occurredAt),
            ),
          );
    const transferGroupId = uuid(random);

    entries.push(
      buildEntry({
        series,
        wallet: from,
        key: null,
        type: "TRANSFER_OUT",
        amount: amountFrom,
        occurredAt,
        note: plan.note,
        transferGroupId,
      }),
      buildEntry({
        series,
        wallet: to,
        key: null,
        type: "TRANSFER_IN",
        amount: amountTo,
        occurredAt,
        note: plan.note,
        transferGroupId,
      }),
    );
  }

  return entries;
}

function spentOn(
  entries: readonly DemoEntry[],
  key: string,
  month: Date,
): number {
  return entries
    .filter(
      (entry) =>
        entry.type === "EXPENSE" &&
        entry.categoryKey === key &&
        entry.occurredAt >= month,
    )
    .reduce((total, entry) => total + entry.baseAmount, 0);
}

function topUpBudgetSpend(
  random: Random,
  series: RateSeries,
  entries: readonly DemoEntry[],
  now: Date,
): DemoEntry[] {
  const month = startOfMonth(now);
  const added: DemoEntry[] = [];

  for (const plan of budgetPlans) {
    const key = categoryKey("EXPENSE", plan.name);
    const spent = spentOn([...entries, ...added], key, month);

    if (spent >= MIN_BUDGET_SPEND) {
      continue;
    }

    added.push(
      buildEntry({
        series,
        wallet: walletOf("card"),
        key,
        type: "EXPENSE",
        amount: MIN_BUDGET_SPEND - spent + between(random, 500, 4_000),
        occurredAt: momentIn(random, month, now.getDate(), now),
        note: null,
      }),
    );
  }

  return added;
}

function budgetLimit(spent: number, permille: number): number {
  const rounded =
    Number(divideHalfUp(BigInt(spent) * BigInt(permille), 100_000n)) * 100;

  if (permille < 1_000) {
    return Math.max(100, Math.min(rounded, spent - 100));
  }

  return Math.max(100, rounded);
}

function buildBudgets(
  entries: readonly DemoEntry[],
  now: Date,
): DemoBudget[] {
  const month = startOfMonth(now);
  const key = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

  return budgetPlans.map((plan) => ({
    categoryKey: categoryKey("EXPENSE", plan.name),
    limitAmount: budgetLimit(
      spentOn(entries, categoryKey("EXPENSE", plan.name), month),
      plan.permille,
    ),
    currency: BASE_CURRENCY,
    month: key,
  }));
}

export function buildDemoData({
  now,
  passwordHash,
  knownRates = [],
}: DemoOptions): DemoData {
  const { from, to } = demoRange(now);
  const { fresh, series } = buildRates(from, to, knownRates);
  const random = randomiser(DEMO_SEED);
  const entries: DemoEntry[] = [];

  for (let index = HISTORY_MONTHS - 1; index >= 0; index -= 1) {
    const month = startOfMonth(subMonths(now, index));
    const lastDay = index === 0 ? now.getDate() : getDaysInMonth(month);

    entries.push(...buildMonth(random, series, month, lastDay, now));
  }

  entries.push(...buildTransfers(random, series, now));
  entries.push(...topUpBudgetSpend(random, series, entries, now));
  entries.sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime());

  const categories = buildDefaultCategories(DEMO_LOCALE);

  return {
    rates: fresh,
    accounts: [
      {
        email: ADMIN_EMAIL,
        name: "Администратор",
        passwordHash,
        role: "ADMIN",
        baseCurrency: BASE_CURRENCY,
        locale: DEMO_LOCALE,
        categories,
        wallets: [],
        entries: [],
        budgets: [],
      },
      {
        email: USER_EMAIL,
        name: "Анна",
        passwordHash,
        role: "USER",
        baseCurrency: BASE_CURRENCY,
        locale: DEMO_LOCALE,
        categories,
        wallets: demoWallets,
        entries,
        budgets: buildBudgets(entries, now),
      },
    ],
  };
}
