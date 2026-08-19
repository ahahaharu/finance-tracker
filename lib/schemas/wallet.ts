import { z } from "zod";

import { Currency, WalletType } from "@/lib/generated/prisma/enums";

const AMOUNT_LIMIT = 2_147_483_647;

const nameSchema = z.string().trim().min(1).max(60);

const balanceSchema = z.int().min(-AMOUNT_LIMIT).max(AMOUNT_LIMIT);

export const createWalletSchema = z.object({
  name: nameSchema,
  type: z.enum(WalletType),
  currency: z.enum(Currency),
  initialBalance: balanceSchema.default(0),
});

export const updateWalletSchema = z
  .object({
    name: nameSchema,
    type: z.enum(WalletType),
    initialBalance: balanceSchema,
  })
  .partial();

export type CreateWalletInput = z.infer<typeof createWalletSchema>;
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>;
