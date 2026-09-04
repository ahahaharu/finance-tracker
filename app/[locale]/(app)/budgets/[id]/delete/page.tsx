import { getTranslations, setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";

import { DeleteBudget } from "./delete-budget";

export default async function DeleteBudgetPage({
  params,
  searchParams,
}: PageProps<"/[locale]/budgets/[id]/delete">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const t = await getTranslations("budgets");

  return (
    <div className="flex w-full max-w-[320px] flex-col gap-section">
      <h1 className="text-20 font-medium">{t("confirmDelete.title")}</h1>
      <DeleteBudget locale={locale} budgetId={id} query={await searchParams} />
    </div>
  );
}
