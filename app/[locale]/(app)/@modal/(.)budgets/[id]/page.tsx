import { getTranslations, setRequestLocale } from "next-intl/server";

import { RouteDialog } from "@/components/ui/dialog";
import { toLocale } from "@/i18n/routing";

import { EditBudget } from "../../../budgets/[id]/edit-budget";

export default async function EditBudgetModal({
  params,
  searchParams,
}: PageProps<"/[locale]/budgets/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const t = await getTranslations("budgets");
  const query = await searchParams;

  return (
    <RouteDialog title={t("form.editTitle")}>
      <EditBudget locale={locale} budgetId={id} query={query} />
    </RouteDialog>
  );
}
