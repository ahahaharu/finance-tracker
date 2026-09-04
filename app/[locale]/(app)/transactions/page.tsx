import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { LinkPending } from "@/components/ui/link-pending";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { toLocale } from "@/i18n/routing";

import { deleteFailed } from "./failure";
import { FilterBar, FilterBarFallback } from "./filter-bar";
import { readFilter, readPage, toQueryString } from "./query";
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
  const failed = deleteFailed(query);

  const t = await getTranslations("transactions");

  const filterQuery = toQueryString(filter);
  const streamKey = `${filterQuery}&page=${page.page}`;

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-20 font-medium">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <a
            href={`/api/v1/transactions/export${filterQuery ? `?${filterQuery}` : ""}`}
            className={buttonVariants({ variant: "ghost" })}
          >
            {t("filters.export")}
          </a>
          <Link
            href="/transactions/new/expense"
            className={buttonVariants({ variant: "primary" })}
          >
            {t("add")}
            <LinkPending />
          </Link>
        </div>
      </div>

      {failed ? (
        <p className="text-12 text-negative">{t("errors.NOT_FOUND")}</p>
      ) : null}

      <Suspense fallback={<FilterBarFallback />}>
        <FilterBar filter={filter} action={`/${locale}/transactions`} />
      </Suspense>

      <Suspense key={streamKey} fallback={<Skeleton rows={8} columns={5} />}>
        <TransactionsList page={page} filter={filter} />
      </Suspense>
    </div>
  );
}
