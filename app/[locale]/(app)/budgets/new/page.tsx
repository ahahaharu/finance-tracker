import { getTranslations, setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";

import { NewBudget } from "./new-budget";

export default async function NewBudgetPage({
  params,
  searchParams,
}: PageProps<"/[locale]/budgets/new">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const t = await getTranslations("budgets");

  return (
    <div className="flex w-full max-w-[320px] flex-col gap-section">
      <h1 className="text-20 font-medium">{t("form.createTitle")}</h1>
      <NewBudget locale={locale} query={await searchParams} />
    </div>
  );
}
