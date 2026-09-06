import { getTranslations, setRequestLocale } from "next-intl/server";

import { RouteDialog } from "@/components/ui/dialog";
import { toLocale } from "@/i18n/routing";

import { EditWallet } from "../../../wallets/[id]/edit-wallet";

export default async function EditWalletModal({
  params,
  searchParams,
}: PageProps<"/[locale]/wallets/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const t = await getTranslations("wallets");

  return (
    <RouteDialog title={t("form.editTitle")} closeHref="/wallets">
      <EditWallet locale={locale} walletId={id} query={await searchParams} />
    </RouteDialog>
  );
}
