import { getTranslations, setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";

import { EditCategory } from "./edit-category";

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/categories/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const t = await getTranslations("categories");

  return (
    <div className="flex flex-col gap-section">
      <h1 className="text-20 font-medium">{t("form.editTitle")}</h1>
      <EditCategory locale={locale} categoryId={id} query={await searchParams} />
    </div>
  );
}
