import type { NextRequest } from "next/server";

import {
  handle,
  malformedBody,
  readJson,
  resource,
  validationFailure,
} from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { updateCategorySchema } from "@/lib/schemas/category";
import {
  deleteCategory,
  getCategory,
  updateCategory,
} from "@/lib/services/category";

export function GET(
  _request: NextRequest,
  context: RouteContext<"/api/v1/categories/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;

    return resource(await getCategory(user.id, id));
  });
}

export function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/v1/categories/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await readJson(request);

    if (!body) {
      return malformedBody();
    }

    const input = updateCategorySchema.safeParse(body.value);

    if (!input.success) {
      return validationFailure(input.error);
    }

    return resource(await updateCategory(user.id, id, input.data));
  });
}

export function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/v1/categories/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;

    await deleteCategory(user.id, id);

    return resource({ id });
  });
}
