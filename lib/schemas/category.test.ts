import { describe, expect, it } from "vitest";

import {
  categoryColors,
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/schemas/category";

const valid = {
  name: "Продукты",
  kind: "EXPENSE",
  color: categoryColors[0],
};

describe("createCategorySchema", () => {
  it("accepts a complete category", () => {
    expect(createCategorySchema.safeParse(valid).success).toBe(true);
  });

  it("trims the name and rejects an empty one", () => {
    const parsed = createCategorySchema.safeParse({
      ...valid,
      name: "  Спорт ",
    });

    expect(parsed.success && parsed.data.name).toBe("Спорт");
    expect(
      createCategorySchema.safeParse({ ...valid, name: "  " }).success,
    ).toBe(false);
  });

  it("rejects a name longer than forty characters", () => {
    expect(
      createCategorySchema.safeParse({ ...valid, name: "п".repeat(41) })
        .success,
    ).toBe(false);
  });

  it("accepts every colour of the fixed palette", () => {
    for (const color of categoryColors) {
      expect(createCategorySchema.safeParse({ ...valid, color }).success).toBe(
        true,
      );
    }
  });

  it("rejects a colour outside the palette", () => {
    expect(
      createCategorySchema.safeParse({ ...valid, color: "#ff0000" }).success,
    ).toBe(false);
  });

  it("rejects an unknown kind", () => {
    expect(
      createCategorySchema.safeParse({ ...valid, kind: "TRANSFER" }).success,
    ).toBe(false);
  });
});

describe("updateCategorySchema", () => {
  it("accepts a change of a single field", () => {
    expect(updateCategorySchema.safeParse({ name: "Еда" }).success).toBe(true);
  });

  it("drops the kind: it is fixed at creation", () => {
    const parsed = updateCategorySchema.safeParse({
      name: "Еда",
      kind: "INCOME",
    });

    expect(parsed.success && parsed.data).toEqual({ name: "Еда" });
  });
});
