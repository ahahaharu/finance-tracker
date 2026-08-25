import { handle, resource } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { invalidate, RATES_TAG } from "@/lib/cache/tags";
import { refreshRatesNow } from "@/lib/services/admin";

export function POST() {
  return handle(async () => {
    const user = await requireUser();
    const result = await refreshRatesNow(user, new Date());

    invalidate([RATES_TAG]);

    return resource(result);
  });
}
