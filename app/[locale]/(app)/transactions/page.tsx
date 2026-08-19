import { Fragment } from "react";
import { format } from "date-fns";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { Amount } from "@/components/ui/amount";
import { CategoryDot } from "@/components/ui/category-dot";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableGroupRow,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { listCategories } from "@/lib/services/category";
import {
  listTransactions,
  transactionContext,
  type TransactionView,
} from "@/lib/services/transaction";
import { balanceOptions, listWallets } from "@/lib/services/wallet";

import { createTransactionAction } from "./actions";
import { TransactionForm } from "./transaction-form";

const dayFormat = { day: "numeric", month: "long" } as const;
const timeFormat = { hour: "2-digit", minute: "2-digit" } as const;

function groupByDay(items: readonly TransactionView[]) {
  const days = new Map<string, TransactionView[]>();

  for (const item of items) {
    const key = format(item.occurredAt, "yyyy-MM-dd");

    days.set(key, [...(days.get(key) ?? []), item]);
  }

  return [...days.entries()];
}

function dayTotal(items: readonly TransactionView[]): number {
  return items.reduce(
    (total, item) =>
      item.type === "INCOME" || item.type === "TRANSFER_IN"
        ? total + item.baseAmount
        : total - item.baseAmount,
    0,
  );
}

export default async function TransactionsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/transactions">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const user = await requireUser();
  const [{ items }, wallets, categories, query, t, formatter] =
    await Promise.all([
      listTransactions(user.id, transactionContext(user)),
      listWallets(user.id, balanceOptions(user)),
      listCategories(user.id),
      searchParams,
      getTranslations("transactions"),
      getFormatter(),
    ]);

  const failed = query.error !== undefined;
  const days = groupByDay(items);

  return (
    <div className="flex flex-col gap-section">
      <h1 className="text-20 font-medium">{t("title")}</h1>

      {wallets.items.length === 0 || categories.items.length === 0 ? (
        <p className="text-13 text-ink-muted">{t("needsWalletAndCategory")}</p>
      ) : (
        <TransactionForm
          action={createTransactionAction.bind(null, locale)}
          wallets={wallets.items}
          categories={categories.items}
          now={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
          variant="row"
        />
      )}

      {failed ? (
        <p className="text-12 text-negative">{t("errors.NOT_FOUND")}</p>
      ) : null}

      {items.length === 0 ? (
        <EmptyState message={t("empty")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-sunken">
              <TableHead>{t("columns.time")}</TableHead>
              <TableHead>{t("columns.description")}</TableHead>
              <TableHead>{t("columns.category")}</TableHead>
              <TableHead>{t("columns.wallet")}</TableHead>
              <TableHead className="text-right">
                {t("columns.amount")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map(([day, entries]) => (
              <Fragment key={day}>
                <TableGroupRow
                  date={formatter.dateTime(new Date(`${day}T00:00:00`), dayFormat)}
                  columns={5}
                  total={
                    <Amount
                      minor={dayTotal(entries)}
                      currency={user.baseCurrency}
                      type="NET"
                    />
                  }
                />
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-ink-muted">
                      {formatter.dateTime(entry.occurredAt, timeFormat)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/transactions/${entry.id}`}
                        className="text-ink underline underline-offset-2"
                      >
                        {entry.note ?? t("noNote")}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {entry.category ? (
                        <CategoryDot
                          color={entry.category.color}
                          name={entry.category.name}
                        />
                      ) : null}
                    </TableCell>
                    <TableCell className="text-ink-muted">
                      {entry.wallet.name}
                    </TableCell>
                    <TableCell className="text-right">
                      <Amount
                        minor={entry.amount}
                        currency={entry.currency}
                        type={entry.type}
                        baseMinor={
                          entry.currency === entry.baseCurrency
                            ? undefined
                            : entry.baseAmount
                        }
                        baseCurrency={entry.baseCurrency}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
