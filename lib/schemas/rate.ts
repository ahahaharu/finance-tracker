import { z } from "zod";

export const rateQuerySchema = z.object({
  date: z.iso.date().optional(),
});

export type RateQuery = z.infer<typeof rateQuerySchema>;
