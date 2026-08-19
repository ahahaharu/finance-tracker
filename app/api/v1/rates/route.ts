import type { NextRequest } from "next/server";

import { collection, handle, validationFailure } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { buildMeta, DEFAULT_PAGE_SIZE } from "@/lib/schemas/collection";
import { rateQuerySchema } from "@/lib/schemas/rate";
import { listRates } from "@/lib/services/exchange-rate";

export function GET(request: NextRequest) {
  return handle(async () => {
    await requireUser();

    const query = rateQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    if (!query.success) {
      return validationFailure(query.error);
    }

    const on = query.data.date
      ? new Date(`${query.data.date}T00:00:00`)
      : new Date();

    const rates = await listRates(on);

    return collection(
      rates,
      buildMeta({ page: 1, pageSize: DEFAULT_PAGE_SIZE }, rates.length),
    );
  });
}
