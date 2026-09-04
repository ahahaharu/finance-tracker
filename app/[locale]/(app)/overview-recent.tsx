import { getFormatter, getTranslations } from "next-intl/server";

import { Amount } from "@/components/ui/amount";
import { buttonVariants } from "@/components/ui/button";
import { CategoryDot } from "@/components/ui/category-dot";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionTitle } from "@/components/ui/section-title";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import {
  listTransactions,
  transactionContext,
} from "@/lib/services/transaction";

const RECENT_SIZE = 8;
const timeFormat = { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" } as const;

async function OverviewRecent() {
  const user = await requireUser();
  const [{ items }, t, formatter] = await Promise.all([
    listTransactions(user.id, transactionContext(user), {
      page: 1,
      pageSize: RECENT_SIZE,
    }),
    getTranslations("dashboard"),
    getFormatter(),
  ]);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <SectionTitle>{t("sections.recent")}</SectionTitle>
        <Link
          href="/transactions"
          className="text-12 text-ink underline underline-offset-2"
        >
          {t("actions.allTransactions")}
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          message={t("empty.transactions")}
          action={
            <Link
              href="/transactions/new/expense"
              className={buttonVariants({ variant: "secondary" })}
            >
              {t("actions.addTransaction")}
            </Link>
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
              <TableHead className="text-right">{t("columns.amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((entry) => (
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
          </TableBody>
        </Table>
      )}
    </section>
  );
}

export { OverviewRecent };
