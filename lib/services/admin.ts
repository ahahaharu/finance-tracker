import { eachDayOfInterval, endOfDay, format, startOfDay, subDays } from "date-fns";

import { NotFoundError, SelfModificationForbiddenError } from "@/lib/errors";
import type { User } from "@/lib/generated/prisma/client";
import type { Role } from "@/lib/generated/prisma/enums";
import {
  type UserFilter,
  type UserWithActivity,
  userRepository,
} from "@/lib/repositories/user";
import type { UpdateUserInput } from "@/lib/schemas/admin";
import type { CollectionQuery } from "@/lib/schemas/collection";
import { assertAdmin } from "@/lib/services/access";
import type { AuthenticatedUser } from "@/lib/services/auth";
import { refreshRates } from "@/lib/services/exchange-rate";

export const REGISTRATION_DAYS = 30;

export type Account = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isBlocked: boolean;
  createdAt: Date;
};

export type AccountView = Account & {
  transactionCount: number;
};

export type AccountList = {
  items: AccountView[];
  total: number;
};

export type RegistrationPoint = {
  date: string;
  count: number;
};

export type AdminStats = {
  userCount: number;
  transactionCount: number;
  registrations: RegistrationPoint[];
};

function toAccount(user: User): Account {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
  };
}

function toAccountView(user: UserWithActivity): AccountView {
  return { ...toAccount(user), transactionCount: user._count.transactions };
}

export function countByDay(
  registrations: readonly Date[],
  from: Date,
  to: Date,
): RegistrationPoint[] {
  const counts = new Map<string, number>();

  for (const registration of registrations) {
    const key = format(registration, "yyyy-MM-dd");

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return eachDayOfInterval({ start: from, end: to }).map((day) => {
    const date = format(day, "yyyy-MM-dd");

    return { date, count: counts.get(date) ?? 0 };
  });
}

export async function listAccounts(
  actor: AuthenticatedUser,
  filter: UserFilter = {},
  page?: CollectionQuery,
): Promise<AccountList> {
  assertAdmin(actor);

  const [users, total] = await Promise.all([
    userRepository.listAll(
      filter,
      page
        ? { skip: (page.page - 1) * page.pageSize, take: page.pageSize }
        : undefined,
    ),
    userRepository.countAll(filter),
  ]);

  return { items: users.map(toAccountView), total };
}

export async function updateAccount(
  actor: AuthenticatedUser,
  userId: string,
  input: UpdateUserInput,
): Promise<Account> {
  assertAdmin(actor);

  if (userId === actor.id) {
    throw new SelfModificationForbiddenError();
  }

  const user = await userRepository.findById(userId);

  if (!user) {
    throw new NotFoundError();
  }

  return toAccount(await userRepository.update(user.id, input));
}

export async function getStats(
  actor: AuthenticatedUser,
  now: Date,
  days: number = REGISTRATION_DAYS,
): Promise<AdminStats> {
  assertAdmin(actor);

  const from = startOfDay(subDays(now, days - 1));
  const to = endOfDay(now);
  const [userCount, transactionCount, registrations] = await Promise.all([
    userRepository.countAll({}),
    userRepository.countTransactions(),
    userRepository.listRegistrations(from, to),
  ]);

  return {
    userCount,
    transactionCount,
    registrations: countByDay(registrations, from, to),
  };
}

export async function refreshRatesNow(
  actor: AuthenticatedUser,
  now: Date,
): Promise<{ dates: number; rates: number }> {
  assertAdmin(actor);

  return refreshRates({ from: now, to: now });
}
