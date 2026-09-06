import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Amount } from "@/components/ui/amount";
import { requireUser } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import { decodeFailure, type SearchParams } from "@/lib/forms/state";
import {
  balanceOptions,
  getWallet,
  type WalletView,
} from "@/lib/services/wallet";

import { updateWalletAction } from "../actions";
import { walletFormErrorCodes } from "../failure";
import { WalletForm } from "../wallet-form";

async function EditWallet({
  locale,
  walletId,
  query,
}: {
  locale: Locale;
  walletId: string;
  query: SearchParams;
}) {
  const user = await requireUser();

  let wallet: WalletView;

  try {
    wallet = await getWallet(user.id, walletId, balanceOptions(user));
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }

  const t = await getTranslations("wallets");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="text-12 text-ink-muted">{t("columns.balance")}</span>
        <Amount minor={wallet.currentBalance} currency={wallet.currency} />
      </div>

      <WalletForm
        action={updateWalletAction.bind(null, locale, wallet.id)}
        wallet={wallet}
        initialState={decodeFailure(query, walletFormErrorCodes)}
      />
    </div>
  );
}

export { EditWallet };
