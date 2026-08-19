import type { NextRequest } from "next/server";

import {
  created,
  handle,
  malformedBody,
  readJson,
  validationFailure,
} from "@/lib/api/response";
import { requireUser } from "@/lib/auth/guards";
import { createTransferSchema } from "@/lib/schemas/transfer";
import { transactionContext } from "@/lib/services/transaction";
import { createTransfer } from "@/lib/services/transfer";

export function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await readJson(request);

    if (!body) {
      return malformedBody();
    }

    const input = createTransferSchema.safeParse(body.value);

    if (!input.success) {
      return validationFailure(input.error);
    }

    const transfer = await createTransfer(
      user.id,
      input.data,
      transactionContext(user),
    );

    return created(transfer, `/api/v1/transfers/${transfer.groupId}`);
  });
}
