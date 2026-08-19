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
import { createTransactionSchema } from "@/lib/schemas/transaction";
import {
  createTransaction,
  listTransactions,
  transactionContext,
} from "@/lib/services/transaction";

export function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const query = collectionQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    if (!query.success) {
      return validationFailure(query.error);
    }

    const { items, total } = await listTransactions(
      user.id,
      transactionContext(user),
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

    const input = createTransactionSchema.safeParse(body.value);

    if (!input.success) {
      return validationFailure(input.error);
    }

    const transaction = await createTransaction(
      user.id,
      input.data,
      transactionContext(user),
    );

    return created(transaction, `/api/v1/transactions/${transaction.id}`);
  });
}
