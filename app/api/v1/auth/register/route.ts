import type { NextRequest } from "next/server";

import {
  created,
  handle,
  malformedBody,
  readJson,
  validationFailure,
} from "@/lib/api/response";
import { routing } from "@/i18n/routing";
import { registerSchema } from "@/lib/schemas/auth";
import { registerUser } from "@/lib/services/auth";
import {
  attemptKey,
  clientAddress,
  consumeAttempt,
} from "@/lib/services/rate-limit";

export function POST(request: NextRequest) {
  return handle(async () => {
    consumeAttempt(attemptKey("register", clientAddress(request.headers)));

    const body = await readJson(request);

    if (!body) {
      return malformedBody();
    }

    const input = registerSchema.safeParse(body.value);

    if (!input.success) {
      return validationFailure(input.error);
    }

    const user = await registerUser(input.data, routing.defaultLocale);

    return created(user, "/api/v1/me");
  });
}
