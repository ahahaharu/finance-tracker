import { collection, handle } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { buildMeta, DEFAULT_PAGE_SIZE } from "@/lib/schemas/collection";
import { getMonthlyTrend } from "@/lib/services/analytics";

export function GET() {
  return handle(async () => {
    const user = await requireUser();
    const points = await getMonthlyTrend(
      user.id,
      user.baseCurrency,
      new Date(),
    );

    return collection(
      points,
      buildMeta({ page: 1, pageSize: DEFAULT_PAGE_SIZE }, points.length),
    );
  });
}
