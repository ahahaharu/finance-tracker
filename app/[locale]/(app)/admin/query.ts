import {
  collectionQuerySchema,
  DEFAULT_PAGE_SIZE,
  type CollectionQuery,
} from "@/lib/schemas/collection";
import { adminUserQuerySchema, type AdminUserQuery } from "@/lib/schemas/admin";

export type SearchParams = Record<string, string | string[] | undefined>;

export const accountErrorCodes = [
  "SELF_MODIFICATION_FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_FAILED",
] as const;

export type AccountErrorCode = (typeof accountErrorCodes)[number];

export type Notice =
  | { kind: "accountError"; code: AccountErrorCode; userId: string }
  | { kind: "ratesRefreshed"; rates: number }
  | { kind: "ratesFailed" };

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function readFilter(query: SearchParams): AdminUserQuery {
  const parsed = adminUserQuerySchema.safeParse({ q: single(query.q) });

  return parsed.success ? parsed.data : {};
}

export function readPage(query: SearchParams): CollectionQuery {
  const parsed = collectionQuerySchema.safeParse(query);

  return parsed.success ? parsed.data : { page: 1, pageSize: DEFAULT_PAGE_SIZE };
}

export function readNotice(query: SearchParams): Notice | null {
  const rates = single(query.rates);

  if (rates === "failed") {
    return { kind: "ratesFailed" };
  }

  if (rates !== undefined) {
    return { kind: "ratesRefreshed", rates: Number(rates) };
  }

  const code = accountErrorCodes.find((known) => known === single(query.error));
  const userId = single(query.userId);

  if (!code || !userId) {
    return null;
  }

  return { kind: "accountError", code, userId };
}

export function listHref(filter: AdminUserQuery, page: number): string {
  const parameters = new URLSearchParams();

  if (filter.q) {
    parameters.set("q", filter.q);
  }

  if (page > 1) {
    parameters.set("page", String(page));
  }

  const query = parameters.toString();

  return query ? `/admin?${query}` : "/admin";
}
