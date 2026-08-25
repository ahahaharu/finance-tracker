import type { NextRequest } from "next/server";

import { collection, handle, validationFailure } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { adminUserQuerySchema } from "@/lib/schemas/admin";
import { buildMeta, collectionQuerySchema } from "@/lib/schemas/collection";
import { listAccounts } from "@/lib/services/admin";

export function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const page = collectionQuerySchema.safeParse(params);

    if (!page.success) {
      return validationFailure(page.error);
    }

    const filter = adminUserQuerySchema.safeParse(params);

    if (!filter.success) {
      return validationFailure(filter.error);
    }

    const { items, total } = await listAccounts(user, filter.data, page.data);

    return collection(items, buildMeta(page.data, total));
  });
}
