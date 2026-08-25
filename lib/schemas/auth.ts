import { z } from "zod";

import { Currency } from "@/lib/generated/prisma/enums";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/\p{L}/u)
  .regex(/[0-9]/);

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(80),
  baseCurrency: z.enum(Currency),
});

export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type CredentialsInput = z.infer<typeof credentialsSchema>;
