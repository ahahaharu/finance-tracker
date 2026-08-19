import { format } from "date-fns";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { Button, buttonVariants } from "@/components/ui/button";
import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import { listCategories } from "@/lib/services/category";
import {
  getTransaction,
  transactionContext,
  type TransactionView,
} from "@/lib/services/transaction";
import { balanceOptions, listWallets } from "@/lib/services/wallet";
import { cn } from "@/lib/utils";

import { deleteTransactionAction, updateTransactionAction } from "../actions";
import { TransactionForm } from "../transaction-form";
import { TransferDetails } from "../transfer-details";

const rateDateFormat = { day: "numeric", month: "long", year: "numeric" } as const;

export default async function TransactionPage({
  params,
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
        locale={locale}
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

      <details className="group flex items-center gap-1">
        <summary
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "w-fit cursor-default list-none [&::-webkit-details-marker]:hidden",
          )}
        >
          <span className="group-open:hidden">{t("actions.delete")}</span>
          <span className="hidden group-open:inline">
            {t("actions.cancel")}
          </span>
        </summary>
        <form action={deleteTransactionAction.bind(null, locale)}>
          <input type="hidden" name="transactionId" value={transaction.id} />
          <Button type="submit" variant="destructive">
            {t("actions.confirmDelete")}
          </Button>
        </form>
      </details>
    </div>
  );
}
