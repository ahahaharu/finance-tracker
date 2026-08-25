import { handle, resource } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { getStats } from "@/lib/services/admin";

export function GET() {
  return handle(async () => {
    const user = await requireUser();

    return resource(await getStats(user, new Date()));
  });
}
