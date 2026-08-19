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
  TableFooter,
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
import {
  collectionQuerySchema,
  DEFAULT_PAGE_SIZE,
  type CollectionQuery,
} from "@/lib/schemas/collection";
import {
  transactionFilterSchema,
  type TransactionFilterInput,
} from "@/lib/schemas/transaction";

import { createTransactionAction } from "./actions";
import { FilterBar } from "./filter-bar";
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

type SearchParams = Record<string, string | string[] | undefined>;

function readFilter(query: SearchParams): TransactionFilterInput {
  const parsed = transactionFilterSchema.safeParse(query);

  return parsed.success ? parsed.data : { sort: "occurredAt:desc" };
}

function readPage(query: SearchParams): CollectionQuery {
  const parsed = collectionQuerySchema.safeParse(query);

  return parsed.success ? parsed.data : { page: 1, pageSize: DEFAULT_PAGE_SIZE };
}

function toQueryString(filter: TransactionFilterInput): string {
  const parameters = new URLSearchParams();

  if (filter.from) parameters.set("from", filter.from);
  if (filter.to) parameters.set("to", filter.to);
  if (filter.type) parameters.set("type", filter.type);
  if (filter.q) parameters.set("q", filter.q);
  if (filter.sort !== "occurredAt:desc") parameters.set("sort", filter.sort);

  for (const walletId of filter.walletId ?? []) {
    parameters.append("walletId", walletId);
  }

  for (const categoryId of filter.categoryId ?? []) {
    parameters.append("categoryId", categoryId);
  }

  return parameters.toString();
}

function pageHref(filterQuery: string, page: number): string {
  const parameters = new URLSearchParams(filterQuery);

  parameters.set("page", String(page));

  return `/transactions?${parameters.toString()}`;
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
  const query = await searchParams;
  const filter = readFilter(query);
  const page = readPage(query);

  const [{ items, total, totals }, wallets, categories, t, formatter] =
    await Promise.all([
      listTransactions(user.id, transactionContext(user), page, filter),
      listWallets(user.id, balanceOptions(user)),
      listCategories(user.id),
      getTranslations("transactions"),
      getFormatter(),
    ]);

  const failed = query.error !== undefined;
  const days = groupByDay(items);
  const totalPages = Math.max(1, Math.ceil(total / page.pageSize));
  const filterQuery = toQueryString(filter);

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

      <FilterBar
        filter={filter}
        wallets={wallets.items}
        categories={categories.items}
        action={`/${locale}/transactions`}
        exportHref={`/api/v1/transactions/export${filterQuery ? `?${filterQuery}` : ""}`}
      />

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
          <TableFooter>
            <TableRow className="hover:bg-sunken">
              <TableCell colSpan={2} className="text-12 text-ink-muted">
                {t("totals.label", { count: total })}
              </TableCell>
              <TableCell className="text-12 text-ink-muted">
                {t("totals.income")}{" "}
                <Amount minor={totals.income} currency={totals.currency} />
              </TableCell>
              <TableCell className="text-12 text-ink-muted">
                {t("totals.expense")}{" "}
                <Amount minor={totals.expense} currency={totals.currency} />
              </TableCell>
              <TableCell className="text-right">
                <Amount
                  minor={totals.net}
                  currency={totals.currency}
                  type="NET"
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )}

      {totalPages > 1 ? (
        <nav className="flex items-center gap-3 text-12 text-ink-muted">
          {page.page > 1 ? (
            <Link
              href={pageHref(filterQuery, page.page - 1)}
              className="text-ink underline underline-offset-2"
            >
              {t("pagination.previous")}
            </Link>
          ) : null}
          <span>
            {t("pagination.position", {
              page: page.page,
              totalPages,
            })}
          </span>
          {page.page < totalPages ? (
            <Link
              href={pageHref(filterQuery, page.page + 1)}
              className="text-ink underline underline-offset-2"
            >
              {t("pagination.next")}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
