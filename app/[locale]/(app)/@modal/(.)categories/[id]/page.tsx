import { getTranslations, setRequestLocale } from "next-intl/server";

import { RouteDialog } from "@/components/ui/dialog";
import { toLocale } from "@/i18n/routing";

import { EditCategory } from "../../../categories/[id]/edit-category";

export default async function EditCategoryModal({
  params,
  searchParams,
}: PageProps<"/[locale]/categories/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const t = await getTranslations("categories");

  return (
    <RouteDialog title={t("form.editTitle")} closeHref="/categories">
      <EditCategory
        locale={locale}
        categoryId={id}
        query={await searchParams}
      />
    </RouteDialog>
  );
}
