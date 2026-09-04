import { getTranslations, setRequestLocale } from "next-intl/server";

import { RouteDialog } from "@/components/ui/dialog";
import { toLocale } from "@/i18n/routing";

import { DeleteTransaction } from "../../../../transactions/[id]/delete/delete-transaction";

export default async function DeleteTransactionModal({
  params,
}: PageProps<"/[locale]/transactions/[id]/delete">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const t = await getTranslations("transactions");

  return (
    <RouteDialog
      title={t("confirmDelete.title")}
      closeHref={`/transactions/${id}`}
    >
      <DeleteTransaction locale={locale} transactionId={id} />
    </RouteDialog>
  );
}
