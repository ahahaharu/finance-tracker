import { getTranslations, setRequestLocale } from "next-intl/server";

import { Amount } from "@/components/ui/amount";
import { buttonVariants } from "@/components/ui/button";
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
import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { listWallets } from "@/lib/services/wallet";

import { type WalletFormErrorCode } from "./actions";
import { DeleteWallet } from "./delete-wallet";

type SearchParams = Record<string, string | string[] | undefined>;

type Failure = {
  code: WalletFormErrorCode;
  walletId: string;
  count: number;
};

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const deleteErrorCodes: readonly WalletFormErrorCode[] = [
  "WALLET_HAS_TRANSACTIONS",
  "NOT_FOUND",
];

function readFailure(query: SearchParams): Failure | null {
  const code = deleteErrorCodes.find((known) => known === single(query.error));
  const walletId = single(query.walletId);

  if (!code || !walletId) {
    return null;
  }

  return { code, walletId, count: Number(single(query.count) ?? 0) };
}

export default async function WalletsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/wallets">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const user = await requireUser();
  const [{ items }, query, t] = await Promise.all([
    listWallets(user.id),
    searchParams,
    getTranslations("wallets"),
  ]);

  const failure = readFailure(query);

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <h1 className="text-20 font-medium">{t("title")}</h1>
        <Link href="/wallets/new" className={buttonVariants({ variant: "primary" })}>
          {t("add")}
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState message={t("empty")} />
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
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-end gap-1">
                    <DeleteWallet walletId={wallet.id} locale={locale} />
                    {failure?.walletId === wallet.id ? (
                      <p className="text-12 text-negative">
                        {failure.code === "WALLET_HAS_TRANSACTIONS"
                          ? t("errors.WALLET_HAS_TRANSACTIONS", {
                              count: failure.count,
                            })
                          : t(`errors.${failure.code}`)}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
