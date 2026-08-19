import { Suspense } from "react";
import { format } from "date-fns";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { listCategories } from "@/lib/services/category";
import { balanceOptions, listWallets } from "@/lib/services/wallet";

import { createTransactionAction } from "./actions";
import { FilterBar } from "./filter-bar";
import { readFilter, readPage, toQueryString } from "./query";
import { TransactionForm } from "./transaction-form";
import { TransactionsList } from "./transactions-list";

export default async function TransactionsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/transactions">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const query = await searchParams;
  const filter = readFilter(query);
  const page = readPage(query);
  const failed = query.error !== undefined;

  const user = await requireUser();
  const [wallets, categories, t] = await Promise.all([
    listWallets(user.id, balanceOptions(user)),
    listCategories(user.id),
    getTranslations("transactions"),
  ]);

  const filterQuery = toQueryString(filter);
  const streamKey = `${filterQuery}&page=${page.page}`;
  const ready = wallets.items.length > 0 && categories.items.length > 0;

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <h1 className="text-20 font-medium">{t("title")}</h1>
        <Link
          href="/transactions/transfer"
          className={buttonVariants({ variant: "secondary" })}
        >
          {t("addTransfer")}
        </Link>
      </div>

      {failed ? (
        <p className="text-12 text-negative">{t("errors.NOT_FOUND")}</p>
      ) : null}

      {ready ? (
        <TransactionForm
          action={createTransactionAction.bind(null, locale)}
          wallets={wallets.items}
          categories={categories.items}
          now={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
          variant="row"
        />
      ) : (
        <p className="text-13 text-ink-muted">{t("needsWalletAndCategory")}</p>
      )}

      <FilterBar
        filter={filter}
        wallets={wallets.items}
        categories={categories.items}
        action={`/${locale}/transactions`}
        exportHref={`/api/v1/transactions/export${filterQuery ? `?${filterQuery}` : ""}`}
      />

      <Suspense key={streamKey} fallback={<Skeleton rows={8} columns={5} />}>
        <TransactionsList page={page} filter={filter} />
      </Suspense>
    </div>
  );
}
