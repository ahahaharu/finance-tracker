import { notFound } from "next/navigation";
import type { Locale } from "next-intl";

import { requireUser } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import { decodeFailure, type SearchParams } from "@/lib/forms/state";
import { type CategoryView, getCategory } from "@/lib/services/category";

import { updateCategoryAction } from "../actions";
import { CategoryForm } from "../category-form";
import { categoryFormErrorCodes } from "../failure";

async function EditCategory({
  locale,
  categoryId,
  query,
}: {
  locale: Locale;
  categoryId: string;
  query: SearchParams;
}) {
  const user = await requireUser();

  let category: CategoryView;

  try {
    category = await getCategory(user.id, categoryId);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }

  return (
    <CategoryForm
      action={updateCategoryAction.bind(null, locale, category.id)}
      category={category}
      initialState={decodeFailure(query, categoryFormErrorCodes)}
    />
  );
}

export { EditCategory };
