import { getTranslations, setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";

import { DeleteTransaction } from "./delete-transaction";

export default async function DeleteTransactionPage({
  params,
}: PageProps<"/[locale]/transactions/[id]/delete">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const t = await getTranslations("transactions");

  return (
    <div className="flex w-full max-w-[320px] flex-col gap-section">
      <h1 className="text-20 font-medium">{t("confirmDelete.title")}</h1>
      <DeleteTransaction locale={locale} transactionId={id} />
    </div>
  );
}
