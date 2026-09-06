import { setRequestLocale } from "next-intl/server";

import { RouteDialog } from "@/components/ui/dialog";
import { toLocale } from "@/i18n/routing";

import {
  EditTransaction,
  transactionTitle,
} from "../../../transactions/[id]/edit-transaction";

export default async function EditTransactionModal({
  params,
  searchParams,
}: PageProps<"/[locale]/transactions/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  return (
    <RouteDialog title={await transactionTitle(id)} closeHref="/transactions">
      <EditTransaction
        locale={locale}
        transactionId={id}
        query={await searchParams}
      />
    </RouteDialog>
  );
}
