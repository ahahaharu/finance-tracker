import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { deleteWalletAction } from "./actions";

async function DeleteWallet({
  walletId,
  locale,
}: {
  walletId: string;
  locale: Locale;
}) {
  const t = await getTranslations("wallets");

  return (
    <details className="group flex items-center justify-end gap-1">
      <summary
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "cursor-default list-none [&::-webkit-details-marker]:hidden",
        )}
      >
        <span className="group-open:hidden">{t("actions.delete")}</span>
        <span className="hidden group-open:inline">{t("actions.cancel")}</span>
      </summary>
      <form action={deleteWalletAction.bind(null, locale)}>
        <input type="hidden" name="walletId" value={walletId} />
        <Button type="submit" variant="destructive">
          {t("actions.confirmDelete")}
        </Button>
      </form>
    </details>
  );
}

export { DeleteWallet };
