import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import { type CategoryView, getCategory } from "@/lib/services/category";

import { updateCategoryAction } from "../actions";
import { CategoryForm } from "../category-form";

export default async function CategoryPage({
  params,
}: PageProps<"/[locale]/categories/[id]">) {
  const { locale: rawLocale, id } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const user = await requireUser();

  let category: CategoryView;

  try {
    category = await getCategory(user.id, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }

  const t = await getTranslations("categories");

  return (
    <div className="flex flex-col gap-section">
      <h1 className="text-20 font-medium">{t("form.editTitle")}</h1>
      <CategoryForm
        action={updateCategoryAction.bind(null, locale, category.id)}
        category={category}
      />
    </div>
  );
}
