import type { Locale } from "next-intl";

import { CategoryKind } from "@/lib/generated/prisma/enums";

type DefaultCategory = {
  kind: CategoryKind;
  color: string;
  names: Record<Locale, string>;
};

const defaultCategories: readonly DefaultCategory[] = [
  {
    kind: CategoryKind.EXPENSE,
    color: "#8c6a4a",
    names: { ru: "Продукты", en: "Groceries" },
  },
  {
    kind: CategoryKind.EXPENSE,
    color: "#6e7f5c",
    names: { ru: "Транспорт", en: "Transport" },
  },
  {
    kind: CategoryKind.EXPENSE,
    color: "#5c7a8c",
    names: { ru: "Жильё", en: "Housing" },
  },
  {
    kind: CategoryKind.EXPENSE,
    color: "#8a6070",
    names: { ru: "Кафе и рестораны", en: "Cafes and restaurants" },
  },
  {
    kind: CategoryKind.EXPENSE,
    color: "#7a6e9a",
    names: { ru: "Здоровье", en: "Health" },
  },
  {
    kind: CategoryKind.EXPENSE,
    color: "#a08048",
    names: { ru: "Одежда", en: "Clothing" },
  },
  {
    kind: CategoryKind.EXPENSE,
    color: "#4f7a6a",
    names: { ru: "Развлечения", en: "Entertainment" },
  },
  {
    kind: CategoryKind.EXPENSE,
    color: "#9a6b52",
    names: { ru: "Связь и интернет", en: "Communication and internet" },
  },
  {
    kind: CategoryKind.EXPENSE,
    color: "#6a7c92",
    names: { ru: "Образование", en: "Education" },
  },
  {
    kind: CategoryKind.EXPENSE,
    color: "#87735e",
    names: { ru: "Прочее", en: "Other" },
  },
  {
    kind: CategoryKind.INCOME,
    color: "#5f8a7e",
    names: { ru: "Зарплата", en: "Salary" },
  },
  {
    kind: CategoryKind.INCOME,
    color: "#96666a",
    names: { ru: "Подработка", en: "Side income" },
  },
  {
    kind: CategoryKind.INCOME,
    color: "#5c7a8c",
    names: { ru: "Подарки", en: "Gifts" },
  },
  {
    kind: CategoryKind.INCOME,
    color: "#87735e",
    names: { ru: "Прочее", en: "Other" },
  },
];

export type NewCategory = {
  name: string;
  kind: CategoryKind;
  color: string;
};

export function buildDefaultCategories(locale: Locale): NewCategory[] {
  return defaultCategories.map(({ kind, color, names }) => ({
    name: names[locale],
    kind,
    color,
  }));
}
