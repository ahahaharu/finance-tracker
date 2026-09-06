import { cache } from "react";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import { decodeFailure, type SearchParams } from "@/lib/forms/state";
import { listCategories } from "@/lib/services/category";
import { getTransaction, transactionContext } from "@/lib/services/transaction";
import { balanceOptions, listWallets } from "@/lib/services/wallet";
import { cn } from "@/lib/utils";

import { updateTransactionAction } from "../actions";
import { transactionFormErrorCodes } from "../failure";
import { TransactionForm } from "../transaction-form";
import { TransferDetails } from "../transfer-details";

const rateDateFormat = {
  day: "numeric",
  month: "long",
  year: "numeric",
} as const;

const readTransaction = cache(async (transactionId: string) => {
  const user = await requireUser();

  try {
    return {
      user,
      transaction: await getTransaction(
        user.id,
        transactionId,
        transactionContext(user),
      ),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }
});

async function transactionTitle(transactionId: string): Promise<string> {
  const { transaction } = await readTransaction(transactionId);

  if (transaction.transferGroupId !== null) {
    const t = await getTranslations("transfers");

    return t("detailsTitle");
  }

  const t = await getTranslations("transactions");

  return t("form.editTitle");
}

async function EditTransaction({
  locale,
  transactionId,
  query,
}: {
  locale: Locale;
  transactionId: string;
  query: SearchParams;
}) {
  const { user, transaction } = await readTransaction(transactionId);

  if (transaction.transferGroupId !== null) {
    return (
      <TransferDetails
        groupId={transaction.transferGroupId}
        transactionId={transaction.id}
        userId={user.id}
        baseCurrency={user.baseCurrency}
      />
    );
  }

  const [wallets, categories, t, formatter] = await Promise.all([
    listWallets(user.id, balanceOptions(user)),
    listCategories(user.id),
    getTranslations("transactions"),
    getFormatter(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <TransactionForm
        action={updateTransactionAction.bind(null, locale, transaction.id)}
        wallets={wallets.items}
        categories={categories.items}
        transaction={{
          type: transaction.type === "INCOME" ? "INCOME" : "EXPENSE",
          amount: transaction.amount,
          walletId: transaction.wallet.id,
          categoryId: transaction.category?.id ?? "",
          occurredAt: format(transaction.occurredAt, "yyyy-MM-dd'T'HH:mm"),
          note: transaction.note,
        }}
        now={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
        initialState={decodeFailure(query, transactionFormErrorCodes)}
      />

      <dl className="flex flex-col gap-2">
        <div className="flex gap-3">
          <dt className="w-40 text-12 text-ink-muted">{t("fields.rate")}</dt>
          <dd className="font-mono text-13 tabular-nums">{transaction.rate}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-40 text-12 text-ink-muted">
            {t("fields.rateDate")}
          </dt>
          <dd className="text-13">
            {formatter.dateTime(transaction.rateDate, rateDateFormat)}
          </dd>
        </div>
      </dl>

      <Link
        href={`/transactions/${transaction.id}/delete`}
        className={cn(buttonVariants({ variant: "destructive" }), "w-fit")}
      >
        {t("actions.delete")}
      </Link>
    </div>
  );
}

export { EditTransaction, transactionTitle };
