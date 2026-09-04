import { CategoryKind } from "@/lib/generated/prisma/enums";

export type SearchParams = Record<string, string | string[] | undefined>;

export const categoryFormErrorCodes = [
  "VALIDATION_FAILED",
  "CATEGORY_NAME_TAKEN",
  "CATEGORY_HAS_TRANSACTIONS",
  "NOT_FOUND",
] as const;

export type CategoryFormErrorCode = (typeof categoryFormErrorCodes)[number];

export type CategoryFormState = {
  code?: CategoryFormErrorCode;
  invalid?: string[];
  transactionCount?: number;
};

export type DeleteFailure = {
  code: CategoryFormErrorCode;
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

export function readDeleteFailure(query: SearchParams): DeleteFailure | null {
  const code = deleteErrorCodes.find((known) => known === single(query.error));

  if (!code) {
    return null;
  }

  return { code, count: Number(single(query.count) ?? 0) };
}
