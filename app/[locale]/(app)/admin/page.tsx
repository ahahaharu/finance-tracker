import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { controlClassName } from "@/components/ui/input";
import { SectionTitle } from "@/components/ui/section-title";
import { Skeleton } from "@/components/ui/skeleton";
import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { Role } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

import { refreshRatesAction } from "./actions";
import { AccountsList } from "./accounts-list";
import { AdminStats } from "./admin-stats";
import { readFilter, readNotice, readPage } from "./query";

export default async function AdminPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const user = await requireUser();

  if (user.role !== Role.ADMIN) {
    notFound();
  }

  const query = await searchParams;
  const filter = readFilter(query);
  const page = readPage(query);
  const notice = readNotice(query);
  const t = await getTranslations("admin");

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-20 font-medium">{t("title")}</h1>
        <form action={refreshRatesAction.bind(null, locale)}>
          <input type="hidden" name="q" value={filter.q ?? ""} />
          <input type="hidden" name="page" value={String(page.page)} />
          <Button type="submit" variant="secondary">
            {t("actions.refreshRates")}
          </Button>
        </form>
      </div>

      {notice?.kind === "ratesRefreshed" ? (
        <p className="text-13 text-ink-muted">
          {t("rates.refreshed", { count: notice.rates })}
        </p>
      ) : null}
      {notice?.kind === "ratesFailed" ? (
        <p className="text-13 text-negative">{t("rates.failed")}</p>
      ) : null}

      <Suspense fallback={<Skeleton rows={2} columns={3} header={false} />}>
        <AdminStats />
      </Suspense>

      <section className="flex flex-col gap-3">
        <SectionTitle>{t("sections.accounts")}</SectionTitle>

        <form method="get" className="flex items-end gap-2">
          <label className="flex flex-col gap-1.5 text-12 text-ink-muted">
            {t("filters.search")}
            <input
              type="search"
              name="q"
              defaultValue={filter.q ?? ""}
              className={cn(controlClassName, "w-64")}
            />
          </label>
          <Button type="submit" variant="secondary">
            {t("filters.apply")}
          </Button>
        </form>

        <Suspense
          key={`${filter.q ?? ""}:${page.page}`}
          fallback={<Skeleton rows={6} columns={6} />}
        >
          <AccountsList
            locale={locale}
            filter={filter}
            page={page}
            notice={notice}
          />
        </Suspense>
      </section>
    </div>
  );
}
