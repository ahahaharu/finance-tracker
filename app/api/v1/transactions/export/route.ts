import { format } from "date-fns";
import type { NextRequest } from "next/server";

import { readSearchParams } from "@/lib/api/query";
import { handle, validationFailure } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { transactionFilterSchema } from "@/lib/schemas/transaction";
import {
  listAllTransactions,
  transactionContext,
} from "@/lib/services/transaction";
import { toCsv } from "@/lib/services/transaction-csv";

export function GET(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const filter = transactionFilterSchema.safeParse(
      readSearchParams(request.nextUrl.searchParams, [
        "walletId",
        "categoryId",
      ]),
    );

    if (!filter.success) {
      return validationFailure(filter.error);
    }

    const transactions = await listAllTransactions(
      user.id,
      transactionContext(user),
      filter.data,
    );

    const filename = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;

    return new Response(toCsv(transactions), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
      },
    });
  });
}
