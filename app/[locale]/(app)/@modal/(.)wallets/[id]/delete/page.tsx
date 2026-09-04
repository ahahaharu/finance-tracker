import { getTranslations, setRequestLocale } from "next-intl/server";

import { RouteDialog } from "@/components/ui/dialog";
import { toLocale } from "@/i18n/routing";

import { DeleteWallet } from "../../../../wallets/[id]/delete/delete-wallet";

export default async function DeleteWalletModal({
  params,
  searchParams,
}: PageProps<"/[locale]/wallets/[id]/delete">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const t = await getTranslations("wallets");

  return (
    <RouteDialog title={t("confirmDelete.title")} closeHref="/wallets">
      <DeleteWallet locale={locale} walletId={id} query={await searchParams} />
    </RouteDialog>
  );
}
