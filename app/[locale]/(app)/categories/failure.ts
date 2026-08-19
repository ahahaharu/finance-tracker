import { CategoryKind } from "@/lib/generated/prisma/enums";

import type { CategoryFormErrorCode } from "./actions";

export type SearchParams = Record<string, string | string[] | undefined>;

export type Failure = {
  code: CategoryFormErrorCode;
  categoryId: string;
  count: number;
};

const deleteErrorCodes: readonly CategoryFormErrorCode[] = [
  "CATEGORY_HAS_TRANSACTIONS",
  "NOT_FOUND",
];

export const kinds = Object.values(CategoryKind);

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function readKind(query: SearchParams): CategoryKind | undefined {
  return kinds.find((kind) => kind === single(query.kind));
}

export function readFailure(query: SearchParams): Failure | null {
  const code = deleteErrorCodes.find((known) => known === single(query.error));
  const categoryId = single(query.categoryId);

  if (!code || !categoryId) {
    return null;
  }

  return { code, categoryId, count: Number(single(query.count) ?? 0) };
}
