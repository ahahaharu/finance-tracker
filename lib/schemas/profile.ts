import { z } from "zod";

import { Currency } from "@/lib/generated/prisma/enums";
import { routing } from "@/i18n/routing";
import { passwordSchema } from "@/lib/schemas/auth";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    locale: z.enum(routing.locales),
    baseCurrency: z.enum(Currency),
  })
  .partial()
  .refine(
    (input) =>
      input.name !== undefined ||
      input.locale !== undefined ||
      input.baseCurrency !== undefined,
    { path: ["name"] },
  );

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
