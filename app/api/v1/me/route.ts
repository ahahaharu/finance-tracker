import type { NextRequest } from "next/server";

import {
  handle,
  malformedBody,
  readJson,
  resource,
  validationFailure,
} from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { updateProfileSchema } from "@/lib/schemas/profile";
import { getProfile, updateProfile } from "@/lib/services/profile";

export function GET() {
  return handle(async () => {
    const user = await requireUser();

    return resource(await getProfile(user.id));
  });
}

export function PATCH(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await readJson(request);

    if (!body) {
      return malformedBody();
    }

    const input = updateProfileSchema.safeParse(body.value);

    if (!input.success) {
      return validationFailure(input.error);
    }

    return resource(await updateProfile(user.id, input.data));
  });
}
