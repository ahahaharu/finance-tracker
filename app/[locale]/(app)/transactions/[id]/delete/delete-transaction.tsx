import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Confirm } from "@/components/ui/confirm";
import { requireUser } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import {
  getTransaction,
  transactionContext,
  type TransactionView,
} from "@/lib/services/transaction";

import { deleteTransactionAction } from "../../actions";
import { deleteTransferAction } from "../../transfer/actions";

async function DeleteTransaction({
  locale,
  transactionId,
}: {
  locale: Locale;
  transactionId: string;
}) {
  const user = await requireUser();

  let transaction: TransactionView;

  try {
    transaction = await getTransaction(
      user.id,
      transactionId,
      transactionContext(user),
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }

  const [t, transfersText] = await Promise.all([
    getTranslations("transactions"),
    getTranslations("transfers"),
  ]);

  if (transaction.transferGroupId !== null) {
    return (
      <Confirm
        message={transfersText("confirmDelete.message")}
        action={deleteTransferAction.bind(null, locale)}
        cancelHref={`/transactions/${transactionId}`}
      >
        <input
          type="hidden"
          name="groupId"
          value={transaction.transferGroupId}
        />
      </Confirm>
    );
  }

  return (
    <Confirm
      message={t("confirmDelete.message")}
      action={deleteTransactionAction.bind(null, locale)}
      cancelHref={`/transactions/${transactionId}`}
    >
      <input type="hidden" name="transactionId" value={transactionId} />
    </Confirm>
  );
}

export { DeleteTransaction };
