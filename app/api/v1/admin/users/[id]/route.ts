import type { NextRequest } from "next/server";

import {
  handle,
  malformedBody,
  readJson,
  resource,
  validationFailure,
} from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { updateUserSchema } from "@/lib/schemas/admin";
import { updateAccount } from "@/lib/services/admin";

export function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/v1/admin/users/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await readJson(request);

    if (!body) {
      return malformedBody();
    }

    const input = updateUserSchema.safeParse(body.value);

    if (!input.success) {
      return validationFailure(input.error);
    }

    return resource(await updateAccount(user, id, input.data));
  });
}
