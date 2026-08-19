import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Amount } from "@/components/ui/amount";
import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import { getWallet, type WalletView } from "@/lib/services/wallet";

import { updateWalletAction } from "../actions";
import { WalletForm } from "../wallet-form";

export default async function WalletPage({
  params,
}: PageProps<"/[locale]/wallets/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const user = await requireUser();

  let wallet: WalletView;

  try {
    wallet = await getWallet(user.id, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }

  const t = await getTranslations("wallets");

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-baseline justify-between">
        <h1 className="text-20 font-medium">{t("form.editTitle")}</h1>
        <div className="flex items-baseline gap-3">
          <span className="text-12 text-ink-muted">
            {t("columns.balance")}
          </span>
          <Amount minor={wallet.currentBalance} currency={wallet.currency} />
        </div>
      </div>
      <WalletForm
        action={updateWalletAction.bind(null, locale, wallet.id)}
        wallet={wallet}
      />
    </div>
  );
}
