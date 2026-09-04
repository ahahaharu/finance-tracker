import { format } from "date-fns";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import { decodeFailure } from "@/lib/forms/state";
import { listCategories } from "@/lib/services/category";
import {
  getTransaction,
  transactionContext,
  type TransactionView,
} from "@/lib/services/transaction";
import { balanceOptions, listWallets } from "@/lib/services/wallet";
import { cn } from "@/lib/utils";

import { updateTransactionAction } from "../actions";
import { transactionFormErrorCodes } from "../failure";
import { TransactionForm } from "../transaction-form";
import { TransferDetails } from "../transfer-details";

const rateDateFormat = { day: "numeric", month: "long", year: "numeric" } as const;

export default async function TransactionPage({
  params,
  searchParams,
}: PageProps<"/[locale]/transactions/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const user = await requireUser();

  let transaction: TransactionView;

  try {
    transaction = await getTransaction(user.id, id, transactionContext(user));
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }

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
    <div className="flex flex-col gap-section">
      <h1 className="text-20 font-medium">{t("form.editTitle")}</h1>

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
        initialState={decodeFailure(await searchParams, transactionFormErrorCodes)}
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
