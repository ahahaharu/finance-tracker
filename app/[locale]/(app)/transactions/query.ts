import {
  collectionQuerySchema,
  DEFAULT_PAGE_SIZE,
  type CollectionQuery,
} from "@/lib/schemas/collection";
import {
  transactionFilterSchema,
  type TransactionFilterInput,
} from "@/lib/schemas/transaction";

export type SearchParams = Record<string, string | string[] | undefined>;

export function readFilter(query: SearchParams): TransactionFilterInput {
  const parsed = transactionFilterSchema.safeParse(query);

  return parsed.success ? parsed.data : { sort: "occurredAt:desc" };
}

export function readPage(query: SearchParams): CollectionQuery {
  const parsed = collectionQuerySchema.safeParse(query);

  return parsed.success ? parsed.data : { page: 1, pageSize: DEFAULT_PAGE_SIZE };
}

export function toQueryString(filter: TransactionFilterInput): string {
  const parameters = new URLSearchParams();

  if (filter.from) parameters.set("from", filter.from);
  if (filter.to) parameters.set("to", filter.to);
  if (filter.type) parameters.set("type", filter.type);
  if (filter.q) parameters.set("q", filter.q);
  if (filter.sort !== "occurredAt:desc") parameters.set("sort", filter.sort);

  for (const walletId of filter.walletId ?? []) {
    parameters.append("walletId", walletId);
  }

  for (const categoryId of filter.categoryId ?? []) {
    parameters.append("categoryId", categoryId);
  }

  return parameters.toString();
}

export function pageHref(filterQuery: string, page: number): string {
  const parameters = new URLSearchParams(filterQuery);

  parameters.set("page", String(page));

  return `/transactions?${parameters.toString()}`;
}
