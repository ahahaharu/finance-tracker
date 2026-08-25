import { z } from "zod";

import { Role } from "@/lib/generated/prisma/enums";

export const adminUserQuerySchema = z.object({
  q: z.string().trim().min(1).max(80).optional(),
});

export const updateUserSchema = z
  .object({
    role: z.enum(Role),
    isBlocked: z.boolean(),
  })
  .partial()
  .refine(
    (input) => input.role !== undefined || input.isBlocked !== undefined,
    { path: ["role"] },
  );

export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
