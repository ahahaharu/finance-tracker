import type { NextRequest } from "next/server";

import { collection, handle, validationFailure } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { analyticsQuerySchema } from "@/lib/schemas/analytics";
import { buildMeta, DEFAULT_PAGE_SIZE } from "@/lib/schemas/collection";
import { getCategoryBreakdown, periodOf } from "@/lib/services/analytics";

export function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const query = analyticsQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    if (!query.success) {
      return validationFailure(query.error);
    }

    const period = periodOf(query.data, new Date());
    const shares = await getCategoryBreakdown(
      user.id,
      user.baseCurrency,
      period,
    );

    return collection(shares, {
      ...buildMeta({ page: 1, pageSize: DEFAULT_PAGE_SIZE }, shares.length),
      period,
    });
  });
}
