import { z } from "zod";

import { AMOUNT_LIMIT } from "@/lib/schemas/transaction";

const amountSchema = z.int().positive().max(AMOUNT_LIMIT);

export const createTransferSchema = z.object({
  fromWalletId: z.string().min(1),
  toWalletId: z.string().min(1),
  amountFrom: amountSchema,
  amountTo: amountSchema.optional(),
  occurredAt: z.coerce.date(),
  note: z
    .string()
    .trim()
    .max(500)
    .transform((note) => (note === "" ? null : note))
    .nullable()
    .optional(),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
