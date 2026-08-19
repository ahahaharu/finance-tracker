import type { NextRequest } from "next/server";

import { handle, resource } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { transactionContext } from "@/lib/services/transaction";
import { deleteTransfer, getTransfer } from "@/lib/services/transfer";

export function GET(
  _request: NextRequest,
  context: RouteContext<"/api/v1/transfers/[groupId]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { groupId } = await context.params;

    return resource(
      await getTransfer(user.id, groupId, transactionContext(user)),
    );
  });
}

export function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/v1/transfers/[groupId]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { groupId } = await context.params;

    await deleteTransfer(user.id, groupId);

    return resource({ groupId });
  });
}
