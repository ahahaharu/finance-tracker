import { prisma } from "@/lib/db";
import type { Currency, Role } from "@/lib/generated/prisma/enums";
import type { User } from "@/lib/generated/prisma/client";
import type { NewCategory } from "@/lib/services/default-categories";

export type NewUser = {
  email: string;
  passwordHash: string;
  name: string;
  baseCurrency: Currency;
  locale: string;
  categories: readonly NewCategory[];
};

export type UserFilter = {
  q?: string;
};

export type UserPage = {
  skip: number;
  take: number;
};

export type UserChanges = {
  role?: Role;
  isBlocked?: boolean;
};

export type UserWithActivity = User & {
  _count: { transactions: number };
};

export type UserRepository = {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
  listAll(filter: UserFilter, page?: UserPage): Promise<UserWithActivity[]>;
  countAll(filter: UserFilter): Promise<number>;
  update(id: string, changes: UserChanges): Promise<User>;
  countTransactions(): Promise<number>;
  listRegistrations(from: Date, to: Date): Promise<Date[]>;
};

function search({ q }: UserFilter) {
  if (!q) {
    return {};
  }

  return {
    OR: [
      { email: { contains: q, mode: "insensitive" as const } },
      { name: { contains: q, mode: "insensitive" as const } },
    ],
  };
}

export const userRepository: UserRepository = {
  findByEmail(email) {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
  },

  findById(id) {
    return prisma.user.findUnique({ where: { id } });
  },

  create({ categories, ...user }) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: user });

      await tx.category.createMany({
        data: categories.map((category) => ({
          ...category,
          userId: created.id,
          isDefault: true,
        })),
      });

      return created;
    });
  },

  listAll(filter, page) {
    return prisma.user.findMany({
      where: search(filter),
      orderBy: { createdAt: "desc" },
      skip: page?.skip,
      take: page?.take,
      include: { _count: { select: { transactions: true } } },
    });
  },

  countAll(filter) {
    return prisma.user.count({ where: search(filter) });
  },

  update(id, changes) {
    return prisma.user.update({ where: { id }, data: changes });
  },

  countTransactions() {
    return prisma.transaction.count();
  },

  async listRegistrations(from, to) {
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    return users.map((user) => user.createdAt);
  },
};
