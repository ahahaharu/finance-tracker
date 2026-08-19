import {
  CategoryHasTransactionsError,
  CategoryNameTakenError,
} from "@/lib/errors";
import type { Category } from "@/lib/generated/prisma/client";
import type { CategoryKind } from "@/lib/generated/prisma/enums";
import {
  type CategoryFilter,
  categoryRepository,
} from "@/lib/repositories/category";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/schemas/category";
import type { CollectionQuery } from "@/lib/schemas/collection";
import { assertOwnership } from "@/lib/services/access";

export type CategoryView = {
  id: string;
  name: string;
  kind: CategoryKind;
  color: string;
  isDefault: boolean;
  createdAt: Date;
};

export type CategoryList = {
  items: CategoryView[];
  total: number;
};

function toView(category: Category): CategoryView {
  return {
    id: category.id,
    name: category.name,
    kind: category.kind,
    color: category.color,
    isDefault: category.isDefault,
    createdAt: category.createdAt,
  };
}

async function assertNameIsFree(
  userId: string,
  kind: CategoryKind,
  name: string,
  currentId?: string,
): Promise<void> {
  const existing = await categoryRepository.findByName(userId, kind, name);

  if (existing && existing.id !== currentId) {
    throw new CategoryNameTakenError();
  }
}

async function ownedCategory(
  userId: string,
  categoryId: string,
): Promise<Category> {
  const category = await categoryRepository.findById(categoryId);

  assertOwnership(category, userId);

  return category;
}

export async function listCategories(
  userId: string,
  filter: CategoryFilter = {},
  page?: CollectionQuery,
): Promise<CategoryList> {
  const [categories, total] = await Promise.all([
    categoryRepository.listByUser(
      userId,
      filter,
      page
        ? { skip: (page.page - 1) * page.pageSize, take: page.pageSize }
        : undefined,
    ),
    categoryRepository.countByUser(userId, filter),
  ]);

  return { items: categories.map(toView), total };
}

export async function getCategory(
  userId: string,
  categoryId: string,
): Promise<CategoryView> {
  return toView(await ownedCategory(userId, categoryId));
}

export async function createCategory(
  userId: string,
  input: CreateCategoryInput,
): Promise<CategoryView> {
  await assertNameIsFree(userId, input.kind, input.name);

  return toView(await categoryRepository.create({ userId, ...input }));
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  input: UpdateCategoryInput,
): Promise<CategoryView> {
  const category = await ownedCategory(userId, categoryId);

  const changes = {
    name: input.name ?? category.name,
    color: input.color ?? category.color,
  };

  if (changes.name !== category.name) {
    await assertNameIsFree(userId, category.kind, changes.name, category.id);
  }

  return toView(await categoryRepository.update(category.id, changes));
}

export async function deleteCategory(
  userId: string,
  categoryId: string,
): Promise<void> {
  const category = await ownedCategory(userId, categoryId);
  const transactionCount = await categoryRepository.countTransactions(
    category.id,
  );

  if (transactionCount > 0) {
    throw new CategoryHasTransactionsError(transactionCount);
  }

  await categoryRepository.remove(category.id);
}
