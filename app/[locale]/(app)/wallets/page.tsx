import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { LinkPending } from "@/components/ui/link-pending";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { toLocale } from "@/i18n/routing";

import { WalletsList } from "./wallets-list";

export default async function WalletsPage({
  params,
}: PageProps<"/[locale]/wallets">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const t = await getTranslations("wallets");

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <h1 className="text-20 font-medium">{t("title")}</h1>
        <Link
          href="/wallets/new"
          className={buttonVariants({ variant: "primary" })}
        >
          {t("add")}
          <LinkPending />
        </Link>
      </div>

      <Suspense fallback={<Skeleton rows={4} columns={5} />}>
        <WalletsList />
      </Suspense>
    </div>
  );
}
