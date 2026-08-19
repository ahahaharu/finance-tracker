import { prisma } from "@/lib/db";
import { CategoryNameTakenError } from "@/lib/errors";
import { Prisma, type Category } from "@/lib/generated/prisma/client";
import type { CategoryKind } from "@/lib/generated/prisma/enums";

export type NewCategory = {
  userId: string;
  name: string;
  kind: CategoryKind;
  color: string;
};

export type CategoryChanges = {
  name: string;
  color: string;
};

export type CategoryFilter = {
  kind?: CategoryKind;
};

export type CategoryPage = {
  skip: number;
  take: number;
};

export type CategoryRepository = {
  listByUser(
    userId: string,
    filter: CategoryFilter,
    page?: CategoryPage,
  ): Promise<Category[]>;
  countByUser(userId: string, filter: CategoryFilter): Promise<number>;
  findById(id: string): Promise<Category | null>;
  findByName(
    userId: string,
    kind: CategoryKind,
    name: string,
  ): Promise<Category | null>;
  countTransactions(categoryId: string): Promise<number>;
  create(data: NewCategory): Promise<Category>;
  update(id: string, changes: CategoryChanges): Promise<Category>;
  remove(id: string): Promise<void>;
};

const UNIQUE_VIOLATION = "P2002";

async function rejectDuplicateName<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === UNIQUE_VIOLATION
    ) {
      throw new CategoryNameTakenError();
    }

    throw error;
  }
}

export const categoryRepository: CategoryRepository = {
  listByUser(userId, filter, page) {
    return prisma.category.findMany({
      where: { userId, kind: filter.kind },
      orderBy: [{ kind: "asc" }, { name: "asc" }],
      skip: page?.skip,
      take: page?.take,
    });
  },

  countByUser(userId, filter) {
    return prisma.category.count({ where: { userId, kind: filter.kind } });
  },

  findById(id) {
    return prisma.category.findUnique({ where: { id } });
  },

  findByName(userId, kind, name) {
    return prisma.category.findUnique({
      where: { userId_kind_name: { userId, kind, name } },
    });
  },

  countTransactions(categoryId) {
    return prisma.transaction.count({ where: { categoryId } });
  },

  create(data) {
    return rejectDuplicateName(() => prisma.category.create({ data }));
  },

  update(id, changes) {
    return rejectDuplicateName(() =>
      prisma.category.update({ where: { id }, data: changes }),
    );
  },

  async remove(id) {
    await prisma.category.delete({ where: { id } });
  },
};
