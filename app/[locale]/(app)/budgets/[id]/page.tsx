import { getTranslations, setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";

import { EditBudget } from "./edit-budget";

export default async function BudgetPage({
  params,
  searchParams,
}: PageProps<"/[locale]/budgets/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const t = await getTranslations("budgets");

  return (
    <div className="flex flex-col gap-section">
      <h1 className="text-20 font-medium">{t("form.editTitle")}</h1>
      <EditBudget locale={locale} budgetId={id} query={await searchParams} />
    </div>
  );
}
