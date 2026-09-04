import { getTranslations, setRequestLocale } from "next-intl/server";

import { RouteDialog } from "@/components/ui/dialog";
import { toLocale } from "@/i18n/routing";

import { readMonth } from "../../../month";
import { NewBudget } from "../../../budgets/new/new-budget";

export default async function NewBudgetModal({
  params,
  searchParams,
}: PageProps<"/[locale]/budgets/new">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const t = await getTranslations("budgets");
  const query = await searchParams;

  return (
    <RouteDialog
      title={t("form.createTitle")}
      closeHref={`/budgets?month=${readMonth(query)}`}
    >
      <NewBudget locale={locale} query={query} />
    </RouteDialog>
  );
}
