import { describe, expect, it } from "vitest";

import { buildDefaultCategories } from "@/lib/services/default-categories";

const palette = [
  "#8c6a4a",
  "#6e7f5c",
  "#5c7a8c",
  "#8a6070",
  "#7a6e9a",
  "#a08048",
  "#4f7a6a",
  "#9a6b52",
  "#6a7c92",
  "#87735e",
  "#5f8a7e",
  "#96666a",
];

describe("buildDefaultCategories", () => {
  it("meets the minimum required by FR-1.9", () => {
    const categories = buildDefaultCategories("ru");

    expect(
      categories.filter(({ kind }) => kind === "EXPENSE"),
    ).toHaveLength(10);
    expect(categories.filter(({ kind }) => kind === "INCOME")).toHaveLength(4);
  });

  it("keeps names unique within a kind", () => {
    for (const locale of ["ru", "en"] as const) {
      for (const kind of ["EXPENSE", "INCOME"] as const) {
        const names = buildDefaultCategories(locale)
          .filter((category) => category.kind === kind)
          .map(({ name }) => name);

        expect(new Set(names).size).toBe(names.length);
      }
    }
  });

  it("uses colours from the fixed palette only", () => {
    for (const { color } of buildDefaultCategories("ru")) {
      expect(palette).toContain(color);
    }
  });

  it("translates every name", () => {
    const ru = buildDefaultCategories("ru");
    const en = buildDefaultCategories("en");

    expect(en).toHaveLength(ru.length);

    for (const [index, category] of en.entries()) {
      expect(category.name).not.toBe(ru[index].name);
      expect(category.name.length).toBeLessThanOrEqual(40);
    }
  });
});
