import { getTranslations, setRequestLocale } from "next-intl/server";

import { RouteDialog } from "@/components/ui/dialog";
import { toLocale } from "@/i18n/routing";

import { DeleteCategory } from "../../../../categories/[id]/delete/delete-category";
import { readKind } from "../../../../categories/failure";

export default async function DeleteCategoryModal({
  params,
  searchParams,
}: PageProps<"/[locale]/categories/[id]/delete">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const t = await getTranslations("categories");
  const query = await searchParams;
  const kind = readKind(query);

  return (
    <RouteDialog
      title={t("confirmDelete.title")}
      closeHref={kind ? `/categories?kind=${kind}` : "/categories"}
    >
      <DeleteCategory locale={locale} categoryId={id} query={query} />
    </RouteDialog>
  );
}
