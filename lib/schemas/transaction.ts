import { z } from "zod";

export const AMOUNT_LIMIT = 2_147_483_647;

export const entryTypes = ["INCOME", "EXPENSE"] as const;

export type EntryType = (typeof entryTypes)[number];

const amountSchema = z.int().positive().max(AMOUNT_LIMIT);

const noteSchema = z
  .string()
  .trim()
  .max(500)
  .transform((note) => (note === "" ? null : note))
  .nullable();

export const createTransactionSchema = z.object({
  type: z.enum(entryTypes),
  amount: amountSchema,
  walletId: z.string().min(1),
  categoryId: z.string().min(1),
  occurredAt: z.coerce.date(),
  note: noteSchema.optional(),
});

export const updateTransactionSchema = z
  .object({
    type: z.enum(entryTypes),
    amount: amountSchema,
    walletId: z.string().min(1),
    categoryId: z.string().min(1),
    occurredAt: z.coerce.date(),
    note: noteSchema,
  })
  .partial();

export const filterTypes = ["INCOME", "EXPENSE", "TRANSFER"] as const;

export type FilterType = (typeof filterTypes)[number];

export const sortOrders = ["occurredAt:desc", "occurredAt:asc"] as const;

const identifiers = z
  .union([z.string().min(1), z.array(z.string().min(1))])
  .transform((value) => (Array.isArray(value) ? value : [value]))
  .optional();

export const transactionFilterSchema = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  walletId: identifiers,
  categoryId: identifiers,
  type: z.enum(filterTypes).optional(),
  q: z.string().trim().min(1).max(200).optional(),
  sort: z.enum(sortOrders).default("occurredAt:desc"),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;
