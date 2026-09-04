import { getTranslations, setRequestLocale } from "next-intl/server";

import { RouteDialog } from "@/components/ui/dialog";
import { toLocale } from "@/i18n/routing";

import { DeleteBudget } from "../../../../budgets/[id]/delete/delete-budget";
import { readMonth } from "../../../../month";

export default async function DeleteBudgetModal({
  params,
  searchParams,
}: PageProps<"/[locale]/budgets/[id]/delete">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const t = await getTranslations("budgets");
  const query = await searchParams;

  return (
    <RouteDialog
      title={t("confirmDelete.title")}
      closeHref={`/budgets?month=${readMonth(query)}`}
    >
      <DeleteBudget locale={locale} budgetId={id} query={query} />
    </RouteDialog>
  );
}
