import { z } from "zod";

export const analyticsQuerySchema = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
