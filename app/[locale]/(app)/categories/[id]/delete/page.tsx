import { getTranslations, setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";

import { DeleteCategory } from "./delete-category";

export default async function DeleteCategoryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/categories/[id]/delete">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const t = await getTranslations("categories");

  return (
    <div className="flex w-full max-w-[320px] flex-col gap-section">
      <h1 className="text-20 font-medium">{t("confirmDelete.title")}</h1>
      <DeleteCategory
        locale={locale}
        categoryId={id}
        query={await searchParams}
      />
    </div>
  );
}
