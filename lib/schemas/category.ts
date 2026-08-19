import { z } from "zod";

import { CategoryKind } from "@/lib/generated/prisma/enums";

export const categoryColors = [
  "#8c6a4a",
  "#6e7f5c",
  "#5c7a8c",
  "#8a6070",
  "#7a6e9a",
  "#a08048",
  "#4f7a6a",
  "#9a6b52",
  "#6a7c92",
  "#87735e",
  "#5f8a7e",
  "#96666a",
] as const;

export type CategoryColor = (typeof categoryColors)[number];

const nameSchema = z.string().trim().min(1).max(40);

const colorSchema = z.enum(categoryColors);

export const createCategorySchema = z.object({
  name: nameSchema,
  kind: z.enum(CategoryKind),
  color: colorSchema,
});

export const updateCategorySchema = z
  .object({
    name: nameSchema,
    color: colorSchema,
  })
  .partial();

export const categoryQuerySchema = z.object({
  kind: z.enum(CategoryKind).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;
