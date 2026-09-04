import { Fragment } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { Amount } from "@/components/ui/amount";
import { CategoryDot } from "@/components/ui/category-dot";
import { buttonVariants } from "@/components/ui/button";
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
import { requireUser } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";
import type { CollectionQuery } from "@/lib/schemas/collection";
import type { TransactionFilterInput } from "@/lib/schemas/transaction";
import {
  listTransactions,
  transactionContext,
  type TransactionView,
} from "@/lib/services/transaction";

import { pageHref, toQueryString } from "./query";

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

async function TransactionsList({
  page,
  filter,
}: {
  page: CollectionQuery;
  filter: TransactionFilterInput;
}) {
  const user = await requireUser();
  const [{ items, total, totals }, t, formatter] = await Promise.all([
    listTransactions(user.id, transactionContext(user), page, filter),
    getTranslations("transactions"),
    getFormatter(),
  ]);

  const days = groupByDay(items);
  const totalPages = Math.max(1, Math.ceil(total / page.pageSize));
  const filterQuery = toQueryString(filter);

  return (
    <>
      {items.length === 0 ? (
        <EmptyState
          message={filterQuery ? t("emptyFiltered") : t("empty")}
          action={
            filterQuery ? (
              <Link
                href="/transactions"
                className={buttonVariants({ variant: "secondary" })}
              >
                {t("filters.reset")}
              </Link>
            ) : (
              <Link
                href="/transactions/new/expense"
                className={buttonVariants({ variant: "secondary" })}
              >
                {t("add")}
              </Link>
            )
          }
        />
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
        <nav className="flex items-center gap-1">
          {page.page > 1 ? (
            <Link
              href={pageHref(filterQuery, page.page - 1)}
              aria-label={t("pagination.previous")}
              className={buttonVariants({ variant: "secondary", size: "icon" })}
            >
              <ChevronLeft />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={cn(
                buttonVariants({ variant: "secondary", size: "icon" }),
                "text-ink-faint opacity-50",
              )}
            >
              <ChevronLeft />
            </span>
          )}
          <span className="px-2 text-12 text-ink-muted">
            {t("pagination.position", {
              page: page.page,
              totalPages,
            })}
          </span>
          {page.page < totalPages ? (
            <Link
              href={pageHref(filterQuery, page.page + 1)}
              aria-label={t("pagination.next")}
              className={buttonVariants({ variant: "secondary", size: "icon" })}
            >
              <ChevronRight />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={cn(
                buttonVariants({ variant: "secondary", size: "icon" }),
                "text-ink-faint opacity-50",
              )}
            >
              <ChevronRight />
            </span>
          )}
        </nav>
      ) : null}
    </>
  );
}

export { TransactionsList };
