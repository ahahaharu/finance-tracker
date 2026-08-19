import type { NextRequest } from "next/server";

import {
  collection,
  created,
  handle,
  malformedBody,
  readJson,
  validationFailure,
} from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { buildMeta, collectionQuerySchema } from "@/lib/schemas/collection";
import { createWalletSchema } from "@/lib/schemas/wallet";
import {
  balanceOptions,
  createWallet,
  listWallets,
} from "@/lib/services/wallet";

export function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const query = collectionQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    if (!query.success) {
      return validationFailure(query.error);
    }

    const { items, total } = await listWallets(
      user.id,
      balanceOptions(user),
      query.data,
    );

    return collection(items, buildMeta(query.data, total));
  });
}

export function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await readJson(request);

    if (!body) {
      return malformedBody();
    }

    const input = createWalletSchema.safeParse(body.value);

    if (!input.success) {
      return validationFailure(input.error);
    }

    const wallet = await createWallet(user.id, input.data, balanceOptions(user));

    return created(wallet, `/api/v1/wallets/${wallet.id}`);
  });
}
