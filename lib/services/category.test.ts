import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CategoryHasTransactionsError,
  CategoryNameTakenError,
  NotFoundError,
} from "@/lib/errors";
import type { Category } from "@/lib/generated/prisma/client";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "@/lib/services/category";

const repository = vi.hoisted(() => ({
  listByUser: vi.fn(),
  countByUser: vi.fn(),
  findById: vi.fn(),
  findByName: vi.fn(),
  countTransactions: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/lib/repositories/category", () => ({
  categoryRepository: repository,
}));

const OWNER = "usr_1";
const STRANGER = "usr_2";

function categoryFixture(overrides: Partial<Category> = {}): Category {
  return {
    id: "cat_1",
    userId: OWNER,
    name: "Продукты",
    kind: "EXPENSE",
    color: "#8c6a4a",
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  repository.listByUser.mockResolvedValue([categoryFixture()]);
  repository.countByUser.mockResolvedValue(1);
  repository.findById.mockResolvedValue(categoryFixture());
  repository.findByName.mockResolvedValue(null);
  repository.countTransactions.mockResolvedValue(0);
  repository.create.mockImplementation((data: Category) =>
    Promise.resolve(categoryFixture(data)),
  );
  repository.update.mockImplementation(
    (id: string, changes: Partial<Category>) =>
      Promise.resolve(categoryFixture({ id, ...changes })),
  );
});

describe("listCategories", () => {
  it("passes the kind filter to the repository", async () => {
    await listCategories(OWNER, { kind: "INCOME" });

    expect(repository.listByUser).toHaveBeenCalledWith(
      OWNER,
      { kind: "INCOME" },
      undefined,
    );
    expect(repository.countByUser).toHaveBeenCalledWith(OWNER, {
      kind: "INCOME",
    });
  });

  it("translates a page into skip and take", async () => {
    await listCategories(OWNER, {}, { page: 2, pageSize: 20 });

    expect(repository.listByUser).toHaveBeenCalledWith(
      OWNER,
      {},
      { skip: 20, take: 20 },
    );
  });

  it("reports the total alongside the items", async () => {
    repository.countByUser.mockResolvedValue(14);

    const { items, total } = await listCategories(OWNER);

    expect(items).toHaveLength(1);
    expect(total).toBe(14);
  });
});

describe("getCategory", () => {
  it("rejects a category owned by another user", async () => {
    await expect(getCategory(STRANGER, "cat_1")).rejects.toThrow(NotFoundError);
  });

  it("rejects a category that does not exist", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(getCategory(OWNER, "cat_1")).rejects.toThrow(NotFoundError);
  });
});

describe("createCategory", () => {
  const input = {
    name: "Спорт",
    kind: "EXPENSE",
    color: "#4f7a6a",
  } as const;

  it("stores the category for the given user", async () => {
    await createCategory(OWNER, input);

    expect(repository.create).toHaveBeenCalledWith({ userId: OWNER, ...input });
  });

  it("rejects a name already used within the same kind", async () => {
    repository.findByName.mockResolvedValue(categoryFixture({ id: "cat_9" }));

    await expect(createCategory(OWNER, input)).rejects.toThrow(
      CategoryNameTakenError,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("checks the name within the kind being created", async () => {
    await createCategory(OWNER, { ...input, kind: "INCOME" });

    expect(repository.findByName).toHaveBeenCalledWith(
      OWNER,
      "INCOME",
      "Спорт",
    );
  });
});

describe("updateCategory", () => {
  it("rejects a category owned by another user", async () => {
    await expect(
      updateCategory(STRANGER, "cat_1", { name: "Еда" }),
    ).rejects.toThrow(NotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("never changes the kind", async () => {
    const category = await updateCategory(OWNER, "cat_1", {
      name: "Еда",
      color: "#6e7f5c",
    });

    expect(repository.update).toHaveBeenCalledWith("cat_1", {
      name: "Еда",
      color: "#6e7f5c",
    });
    expect(category.kind).toBe("EXPENSE");
  });

  it("keeps the fields left out of a partial change", async () => {
    await updateCategory(OWNER, "cat_1", { color: "#96666a" });

    expect(repository.update).toHaveBeenCalledWith("cat_1", {
      name: "Продукты",
      color: "#96666a",
    });
    expect(repository.findByName).not.toHaveBeenCalled();
  });

  it("checks a new name against the kind of the stored category", async () => {
    repository.findById.mockResolvedValue(categoryFixture({ kind: "INCOME" }));

    await updateCategory(OWNER, "cat_1", { name: "Премия" });

    expect(repository.findByName).toHaveBeenCalledWith(
      OWNER,
      "INCOME",
      "Премия",
    );
  });

  it("rejects a name already used by another category of the same kind", async () => {
    repository.findByName.mockResolvedValue(categoryFixture({ id: "cat_2" }));

    await expect(
      updateCategory(OWNER, "cat_1", { name: "Еда" }),
    ).rejects.toThrow(CategoryNameTakenError);
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe("deleteCategory", () => {
  it("removes a category without transactions", async () => {
    await deleteCategory(OWNER, "cat_1");

    expect(repository.remove).toHaveBeenCalledWith("cat_1");
  });

  it("refuses to remove a category with transactions and reports their count", async () => {
    repository.countTransactions.mockResolvedValue(340);

    await expect(deleteCategory(OWNER, "cat_1")).rejects.toMatchObject({
      code: "CATEGORY_HAS_TRANSACTIONS",
      details: { transactionCount: 340 },
    });
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it("throws a typed domain error for a category with transactions", async () => {
    repository.countTransactions.mockResolvedValue(1);

    await expect(deleteCategory(OWNER, "cat_1")).rejects.toThrow(
      CategoryHasTransactionsError,
    );
  });

  it("rejects a category owned by another user", async () => {
    await expect(deleteCategory(STRANGER, "cat_1")).rejects.toThrow(
      NotFoundError,
    );
    expect(repository.remove).not.toHaveBeenCalled();
  });
});
