import { getTranslations, setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";

import { DeleteWallet } from "./delete-wallet";

export default async function DeleteWalletPage({
  params,
  searchParams,
}: PageProps<"/[locale]/wallets/[id]/delete">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const t = await getTranslations("wallets");

  return (
    <div className="flex w-full max-w-[320px] flex-col gap-section">
      <h1 className="text-20 font-medium">{t("confirmDelete.title")}</h1>
      <DeleteWallet locale={locale} walletId={id} query={await searchParams} />
    </div>
  );
}
