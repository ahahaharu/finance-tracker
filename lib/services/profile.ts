import { compare, hash } from "bcryptjs";

import {
  InvalidCredentialsError,
  NotFoundError,
  RateNotAvailableError,
} from "@/lib/errors";
import type { User } from "@/lib/generated/prisma/client";
import type { Currency, Role } from "@/lib/generated/prisma/enums";
import {
  type BudgetRebase,
  profileRepository,
  type TransactionRebase,
} from "@/lib/repositories/profile";
import { userRepository } from "@/lib/repositories/user";
import type {
  ChangePasswordInput,
  UpdateProfileInput,
} from "@/lib/schemas/profile";
import { BCRYPT_COST } from "@/lib/services/auth";
import {
  applyRate,
  findConversion,
  isoDate,
  parseRate,
} from "@/lib/services/exchange-rate";

export type ProfileView = {
  id: string;
  email: string;
  name: string;
  role: Role;
  baseCurrency: Currency;
  locale: string;
  createdAt: Date;
};

export type Rebase = {
  transactions: TransactionRebase[];
  budgets: BudgetRebase[];
};

function toView(user: User): ProfileView {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    baseCurrency: user.baseCurrency,
    locale: user.locale,
    createdAt: user.createdAt,
  };
}

async function ownProfile(userId: string): Promise<User> {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new NotFoundError();
  }

  return user;
}

export async function planRebase(
  userId: string,
  baseCurrency: Currency,
): Promise<Rebase> {
  const [transactions, budgets] = await Promise.all([
    profileRepository.listTransactionsToRebase(userId),
    profileRepository.listBudgetsToRebase(userId),
  ]);
  const conversions = new Map<
    string,
    { rate: string; rateDate: Date; scaled: bigint }
  >();

  async function conversionFor(from: Currency, on: Date) {
    const key = `${from}:${isoDate(on)}`;
    const cached = conversions.get(key);

    if (cached) {
      return cached;
    }

    const conversion = await findConversion({ from, to: baseCurrency, on });

    if (!conversion) {
      throw new RateNotAvailableError();
    }

    const resolved = { ...conversion, scaled: parseRate(conversion.rate) };

    conversions.set(key, resolved);

    return resolved;
  }

  const rebasedTransactions: TransactionRebase[] = [];

  for (const transaction of transactions) {
    const { rate, rateDate, scaled } = await conversionFor(
      transaction.currency,
      transaction.rateDate,
    );

    rebasedTransactions.push({
      id: transaction.id,
      rate,
      rateDate,
      baseAmount: applyRate(transaction.amount, scaled),
    });
  }

  const rebasedBudgets: BudgetRebase[] = [];

  for (const budget of budgets) {
    const { scaled } = await conversionFor(budget.currency, budget.month);

    rebasedBudgets.push({
      id: budget.id,
      currency: baseCurrency,
      limitAmount: applyRate(budget.limitAmount, scaled),
    });
  }

  return { transactions: rebasedTransactions, budgets: rebasedBudgets };
}

export async function getProfile(userId: string): Promise<ProfileView> {
  return toView(await ownProfile(userId));
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<ProfileView> {
  const user = await ownProfile(userId);
  const changesBaseCurrency =
    input.baseCurrency !== undefined && input.baseCurrency !== user.baseCurrency;

  if (!changesBaseCurrency) {
    if (input.name === undefined && input.locale === undefined) {
      return toView(user);
    }

    return toView(
      await userRepository.updateProfile(user.id, {
        name: input.name,
        locale: input.locale,
      }),
    );
  }

  const baseCurrency = input.baseCurrency as Currency;
  const { transactions, budgets } = await planRebase(user.id, baseCurrency);

  return toView(
    await profileRepository.applyBaseCurrency({
      userId: user.id,
      baseCurrency,
      name: input.name,
      locale: input.locale,
      transactions,
      budgets,
    }),
  );
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await ownProfile(userId);
  const matches = await compare(input.currentPassword, user.passwordHash);

  if (!matches) {
    throw new InvalidCredentialsError();
  }

  await userRepository.updatePassword(
    user.id,
    await hash(input.newPassword, BCRYPT_COST),
  );
}
