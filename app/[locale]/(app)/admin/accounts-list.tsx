import type { Locale } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/ui/empty-state";
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
import type { AdminUserQuery } from "@/lib/schemas/admin";
import type { CollectionQuery } from "@/lib/schemas/collection";
import { listAccounts } from "@/lib/services/admin";

import { AccountActions } from "./account-actions";
import { listHref, type Notice } from "./query";

const dateFormat = { day: "numeric", month: "short", year: "numeric" } as const;

async function AccountsList({
  locale,
  filter,
  page,
  notice,
}: {
  locale: Locale;
  filter: AdminUserQuery;
  page: CollectionQuery;
  notice: Notice | null;
}) {
  const actor = await requireUser();
  const [{ items, total }, t, formatter] = await Promise.all([
    listAccounts(actor, filter, page),
    getTranslations("admin"),
    getFormatter(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / page.pageSize));

  if (items.length === 0) {
    return <EmptyState message={t("empty")} />;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-sunken">
            <TableHead>{t("columns.email")}</TableHead>
            <TableHead>{t("columns.name")}</TableHead>
            <TableHead>{t("columns.role")}</TableHead>
            <TableHead>{t("columns.createdAt")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
            <TableHead>{t("columns.transactions")}</TableHead>
            <TableHead>
              <span className="sr-only">{t("columns.actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="text-ink">{account.email}</TableCell>
              <TableCell className="text-ink-muted">{account.name}</TableCell>
              <TableCell className="text-ink-muted">
                {t(`roles.${account.role}`)}
              </TableCell>
              <TableCell className="text-ink-muted">
                {formatter.dateTime(account.createdAt, dateFormat)}
              </TableCell>
              <TableCell
                className={account.isBlocked ? "text-negative" : "text-ink-muted"}
              >
                {t(account.isBlocked ? "status.blocked" : "status.active")}
              </TableCell>
              <TableCell className="text-ink-muted">
                {account.transactionCount}
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-end gap-1">
                  {account.id === actor.id ? (
                    <span className="text-12 text-ink-faint">{t("self")}</span>
                  ) : (
                    <AccountActions
                      account={account}
                      filter={filter}
                      page={page}
                      locale={locale}
                    />
                  )}
                  {notice?.kind === "accountError" &&
                  notice.userId === account.id ? (
                    <p className="text-12 text-negative">
                      {t(`errors.${notice.code}`)}
                    </p>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 ? (
        <nav className="flex items-center gap-3 text-12 text-ink-muted">
          {page.page > 1 ? (
            <Link
              href={listHref(filter, page.page - 1)}
              className="text-ink underline underline-offset-2"
            >
              {t("pagination.previous")}
            </Link>
          ) : null}
          <span>
            {t("pagination.position", { page: page.page, totalPages })}
          </span>
          {page.page < totalPages ? (
            <Link
              href={listHref(filter, page.page + 1)}
              className="text-ink underline underline-offset-2"
            >
              {t("pagination.next")}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}

export { AccountsList };
