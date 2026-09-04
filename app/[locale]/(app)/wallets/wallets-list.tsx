import { getTranslations } from "next-intl/server";

import { Amount } from "@/components/ui/amount";
import { buttonVariants } from "@/components/ui/button";
import { LinkPending } from "@/components/ui/link-pending";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import { balanceOptions, listWallets } from "@/lib/services/wallet";

async function WalletsList() {
  const user = await requireUser();
  const [{ items, totalBalance }, t] = await Promise.all([
    listWallets(user.id, balanceOptions(user)),
    getTranslations("wallets"),
  ]);

  return (
    <>
      {items.length === 0 ? (
        <EmptyState
          message={t("empty")}
          action={
            <Link
              href="/wallets/new"
              className={buttonVariants({ variant: "secondary" })}
            >
              {t("add")}
            </Link>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-sunken">
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.type")}</TableHead>
              <TableHead>{t("columns.currency")}</TableHead>
              <TableHead className="text-right">
                {t("columns.balance")}
              </TableHead>
              <TableHead>
                <span className="sr-only">{t("columns.actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((wallet) => (
              <TableRow key={wallet.id}>
                <TableCell>
                  <Link
                    href={`/wallets/${wallet.id}`}
                    className="text-ink underline underline-offset-2"
                  >
                    {wallet.name}
                  </Link>
                </TableCell>
                <TableCell className="text-ink-muted">
                  {t(`types.${wallet.type}`)}
                </TableCell>
                <TableCell className="text-ink-muted">
                  {wallet.currency}
                </TableCell>
                <TableCell className="text-right">
                  <Amount
                    minor={wallet.currentBalance}
                    currency={wallet.currency}
                    baseMinor={
                      wallet.currency === wallet.baseCurrency ||
                      wallet.baseBalance === null
                        ? undefined
                        : wallet.baseBalance
                    }
                    baseCurrency={wallet.baseCurrency}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/wallets/${wallet.id}/delete`}
                    className={buttonVariants({ variant: "destructive" })}
                  >
                    {t("actions.delete")}
                    <LinkPending />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="hover:bg-sunken">
              <TableCell colSpan={3} className="text-12 text-ink-muted">
                {t("total")}
              </TableCell>
              <TableCell className="text-right">
                <Amount
                  minor={totalBalance.amount}
                  currency={totalBalance.currency}
                />
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      )}

      {items.length > 0 && !totalBalance.complete ? (
        <p className="text-12 text-ink-muted">{t("totalIncomplete")}</p>
      ) : null}
    </>
  );
}

export { WalletsList };
