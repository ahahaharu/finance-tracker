import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { LinkPending } from "@/components/ui/link-pending";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { toLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import { CategoriesList } from "./categories-list";
import { kinds, readKind } from "./failure";

export default async function CategoriesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/categories">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const query = await searchParams;
  const kind = readKind(query);
  const t = await getTranslations("categories");

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <h1 className="text-20 font-medium">{t("title")}</h1>
        <Link
          href={kind ? `/categories/new?kind=${kind}` : "/categories/new"}
          className={buttonVariants({ variant: "primary" })}
        >
          {t("add")}
          <LinkPending />
        </Link>
      </div>

      <nav className="flex items-center gap-1">
        <Link
          href="/categories"
          aria-current={kind === undefined ? "page" : undefined}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            kind === undefined && "bg-sunken",
          )}
        >
          {t("filters.all")}
        </Link>
        {kinds.map((value) => (
          <Link
            key={value}
            href={`/categories?kind=${value}`}
            aria-current={kind === value ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              kind === value && "bg-sunken",
            )}
          >
            {t(`kinds.${value}`)}
          </Link>
        ))}
      </nav>

      <Suspense fallback={<Skeleton rows={6} columns={3} />}>
        <CategoriesList kind={kind} />
      </Suspense>
    </div>
  );
}
