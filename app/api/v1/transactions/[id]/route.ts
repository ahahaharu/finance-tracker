import type { NextRequest } from "next/server";

import {
  handle,
  malformedBody,
  readJson,
  resource,
  validationFailure,
} from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { updateTransactionSchema } from "@/lib/schemas/transaction";
import {
  deleteTransaction,
  getTransaction,
  transactionContext,
  updateTransaction,
} from "@/lib/services/transaction";

export function GET(
  _request: NextRequest,
  context: RouteContext<"/api/v1/transactions/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;

    return resource(await getTransaction(user.id, id, transactionContext(user)));
  });
}

export function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/v1/transactions/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await readJson(request);

    if (!body) {
      return malformedBody();
    }

    const input = updateTransactionSchema.safeParse(body.value);

    if (!input.success) {
      return validationFailure(input.error);
    }

    return resource(
      await updateTransaction(user.id, id, input.data, transactionContext(user)),
    );
  });
}

export function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/v1/transactions/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;

    await deleteTransaction(user.id, id);

    return resource({ id });
  });
}
