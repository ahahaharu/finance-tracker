import type { NextRequest } from "next/server";

import {
  handle,
  malformedBody,
  readJson,
  resource,
  validationFailure,
} from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { updateWalletSchema } from "@/lib/schemas/wallet";
import {
  balanceOptions,
  deleteWallet,
  getWallet,
  updateWallet,
} from "@/lib/services/wallet";

export function GET(
  _request: NextRequest,
  context: RouteContext<"/api/v1/wallets/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;

    return resource(await getWallet(user.id, id, balanceOptions(user)));
  });
}

export function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/v1/wallets/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await readJson(request);

    if (!body) {
      return malformedBody();
    }

    const input = updateWalletSchema.safeParse(body.value);

    if (!input.success) {
      return validationFailure(input.error);
    }

    return resource(
      await updateWallet(user.id, id, input.data, balanceOptions(user)),
    );
  });
}

export function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/v1/wallets/[id]">,
) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;

    await deleteWallet(user.id, id);

    return resource({ id });
  });
}
