import { getTranslations, setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";
import { decodeFailure } from "@/lib/forms/state";

import { createWalletAction } from "../actions";
import { walletFormErrorCodes } from "../failure";
import { WalletForm } from "../wallet-form";

export default async function NewWalletPage({
  params,
  searchParams,
}: PageProps<"/[locale]/wallets/new">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const t = await getTranslations("wallets");

  return (
    <div className="flex flex-col gap-section">
      <h1 className="text-20 font-medium">{t("form.createTitle")}</h1>
      <WalletForm
        action={createWalletAction.bind(null, locale)}
        initialState={decodeFailure(await searchParams, walletFormErrorCodes)}
      />
    </div>
  );
}
