import { z } from "zod";

import { AMOUNT_LIMIT } from "@/lib/schemas/transaction";

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

const limitSchema = z.int().positive().max(AMOUNT_LIMIT);

export const createBudgetSchema = z.object({
  categoryId: z.string().min(1),
  limitAmount: limitSchema,
  month: monthSchema,
});

export const updateBudgetSchema = z.object({
  limitAmount: limitSchema,
});

export const budgetQuerySchema = z.object({
  month: monthSchema.optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type BudgetQuery = z.infer<typeof budgetQuerySchema>;
