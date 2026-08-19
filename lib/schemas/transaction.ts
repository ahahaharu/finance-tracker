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

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
