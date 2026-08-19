import type { NextRequest } from "next/server";

import { failure, handle, resource } from "@/lib/api/response";
import { invalidate, RATES_TAG } from "@/lib/cache/tags";
import { refreshRates } from "@/lib/services/exchange-rate";

export function GET(request: NextRequest) {
  return handle(async () => {
    const secret = process.env.CRON_SECRET;

    if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
      return failure("FORBIDDEN", "Cron secret does not match");
    }

    const today = new Date();
    const result = await refreshRates({ from: today, to: today });

    invalidate([RATES_TAG]);

    return resource(result);
  });
}
