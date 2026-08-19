import type { NextRequest } from "next/server";

import {
  collection,
  created,
  handle,
  malformedBody,
  readJson,
  validationFailure,
} from "@/lib/api/response";
import { readSearchParams } from "@/lib/api/query";
import { requireUser } from "@/lib/auth/guards";
import { buildMeta, collectionQuerySchema } from "@/lib/schemas/collection";
import {
  createTransactionSchema,
  transactionFilterSchema,
} from "@/lib/schemas/transaction";
import {
  createTransaction,
  listTransactions,
  transactionContext,
} from "@/lib/services/transaction";

export function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const parameters = request.nextUrl.searchParams;
    const page = collectionQuerySchema.safeParse(
      Object.fromEntries(parameters),
    );

    if (!page.success) {
      return validationFailure(page.error);
    }

    const filter = transactionFilterSchema.safeParse(readSearchParams(parameters, ["walletId", "categoryId"]));

    if (!filter.success) {
      return validationFailure(filter.error);
    }

    const { items, total, totals } = await listTransactions(
      user.id,
      transactionContext(user),
      page.data,
      filter.data,
    );

    return collection(items, { ...buildMeta(page.data, total), totals });
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
