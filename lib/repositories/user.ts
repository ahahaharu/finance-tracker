import { prisma } from "@/lib/db";
import type { Currency } from "@/lib/generated/prisma/enums";
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

export type UserRepository = {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
};

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
};
