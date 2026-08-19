import type { NextRequest } from "next/server";

import {
  collection,
  created,
  handle,
  malformedBody,
  readJson,
  validationFailure,
} from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import {
  categoryQuerySchema,
  createCategorySchema,
} from "@/lib/schemas/category";
import { buildMeta, collectionQuerySchema } from "@/lib/schemas/collection";
import { createCategory, listCategories } from "@/lib/services/category";

export function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const page = collectionQuerySchema.safeParse(params);

    if (!page.success) {
      return validationFailure(page.error);
    }

    const filter = categoryQuerySchema.safeParse(params);

    if (!filter.success) {
      return validationFailure(filter.error);
    }

    const { items, total } = await listCategories(
      user.id,
      filter.data,
      page.data,
    );

    return collection(items, buildMeta(page.data, total));
  });
}

export function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await readJson(request);

    if (!body) {
      return malformedBody();
    }

    const input = createCategorySchema.safeParse(body.value);

    if (!input.success) {
      return validationFailure(input.error);
    }

    const category = await createCategory(user.id, input.data);

    return created(category, `/api/v1/categories/${category.id}`);
  });
}
