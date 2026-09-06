import { getTranslations, setRequestLocale } from "next-intl/server";

import { RouteDialog } from "@/components/ui/dialog";
import { toLocale } from "@/i18n/routing";

import { DeleteCategory } from "../../../../categories/[id]/delete/delete-category";

export default async function DeleteCategoryModal({
  params,
  searchParams,
}: PageProps<"/[locale]/categories/[id]/delete">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const t = await getTranslations("categories");
  const query = await searchParams;

  return (
    <RouteDialog title={t("confirmDelete.title")}>
      <DeleteCategory locale={locale} categoryId={id} query={query} />
    </RouteDialog>
  );
}
