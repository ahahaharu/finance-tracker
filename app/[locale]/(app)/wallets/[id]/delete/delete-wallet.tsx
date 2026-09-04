import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Confirm } from "@/components/ui/confirm";
import { requireUser } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import type { SearchParams } from "@/lib/forms/state";
import { balanceOptions, getWallet, type WalletView } from "@/lib/services/wallet";

import { deleteWalletAction } from "../../actions";
import { readDeleteFailure } from "../../failure";

async function DeleteWallet({
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
  const failure = readDeleteFailure(query);

  return (
    <Confirm
      message={t("confirmDelete.message", { name: wallet.name })}
      error={
        failure?.code === "WALLET_HAS_TRANSACTIONS"
          ? t("errors.WALLET_HAS_TRANSACTIONS", { count: failure.count })
          : failure
            ? t(`errors.${failure.code}`)
            : undefined
      }
      action={deleteWalletAction.bind(null, locale)}
      cancelHref="/wallets"
    >
      <input type="hidden" name="walletId" value={walletId} />
    </Confirm>
  );
}

export { DeleteWallet };
