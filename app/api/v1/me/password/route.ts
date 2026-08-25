import type { NextRequest } from "next/server";

import {
  handle,
  malformedBody,
  readJson,
  resource,
  validationFailure,
} from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { changePasswordSchema } from "@/lib/schemas/profile";
import { changePassword } from "@/lib/services/profile";

export function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await readJson(request);

    if (!body) {
      return malformedBody();
    }

    const input = changePasswordSchema.safeParse(body.value);

    if (!input.success) {
      return validationFailure(input.error);
    }

    await changePassword(user.id, input.data);

    return resource({ id: user.id });
  });
}
