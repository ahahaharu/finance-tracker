import type { NextRequest } from "next/server";

import { handle, resource, validationFailure } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { analyticsQuerySchema } from "@/lib/schemas/analytics";
import { getSummary, periodOf } from "@/lib/services/analytics";
import { balanceOptions } from "@/lib/services/wallet";

export function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const query = analyticsQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    if (!query.success) {
      return validationFailure(query.error);
    }

    const options = balanceOptions(user);
    const summary = await getSummary(
      user.id,
      options,
      periodOf(query.data, options.on),
    );

    return resource(summary);
  });
}
