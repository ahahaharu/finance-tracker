import type { NextRequest } from "next/server";

import {
  handle,
  malformedBody,
  readJson,
  resource,
  validationFailure,
} from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { updateBudgetSchema } from "@/lib/schemas/budget";
import { deleteBudget, getBudget, updateBudget } from "@/lib/services/budget";

export function GET(
  _request: NextRequest,
  context: RouteContext<"/api/v1/budgets/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;

    return resource(await getBudget(user.id, id));
  });
}

export function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/v1/budgets/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await readJson(request);

    if (!body) {
      return malformedBody();
    }

    const input = updateBudgetSchema.safeParse(body.value);

    if (!input.success) {
      return validationFailure(input.error);
    }

    return resource(await updateBudget(user.id, id, input.data));
  });
}

export function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/v1/budgets/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;

    await deleteBudget(user.id, id);

    return resource({ id });
  });
}
