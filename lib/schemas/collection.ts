import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 50;

export const collectionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
});

export type CollectionQuery = z.infer<typeof collectionQuerySchema>;

export type CollectionMeta = CollectionQuery & {
  total: number;
  totalPages: number;
};

export function buildMeta(query: CollectionQuery, total: number): CollectionMeta {
  return {
    ...query,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}
