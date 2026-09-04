import { getTranslations, setRequestLocale } from "next-intl/server";

import { RouteDialog } from "@/components/ui/dialog";
import { toLocale } from "@/i18n/routing";
import { decodeFailure } from "@/lib/forms/state";

import { createWalletAction } from "../../../wallets/actions";
import { walletFormErrorCodes } from "../../../wallets/failure";
import { WalletForm } from "../../../wallets/wallet-form";

export default async function NewWalletModal({
  params,
  searchParams,
}: PageProps<"/[locale]/wallets/new">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const t = await getTranslations("wallets");

  return (
    <RouteDialog title={t("form.createTitle")} closeHref="/wallets">
      <WalletForm
        action={createWalletAction.bind(null, locale)}
        initialState={decodeFailure(await searchParams, walletFormErrorCodes)}
      />
    </RouteDialog>
  );
}
