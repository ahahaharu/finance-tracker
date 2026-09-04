import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Confirm } from "@/components/ui/confirm";
import { requireUser } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import type { SearchParams } from "@/lib/forms/state";
import { type CategoryView, getCategory } from "@/lib/services/category";

import { deleteCategoryAction } from "../../actions";
import { readDeleteFailure, readKind } from "../../failure";

async function DeleteCategory({
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

  const t = await getTranslations("categories");
  const failure = readDeleteFailure(query);
  const kind = readKind(query);

  return (
    <Confirm
      message={t("confirmDelete.message", { name: category.name })}
      error={
        failure?.code === "CATEGORY_HAS_TRANSACTIONS"
          ? t("errors.CATEGORY_HAS_TRANSACTIONS", { count: failure.count })
          : failure
            ? t(`errors.${failure.code}`)
            : undefined
      }
      action={deleteCategoryAction.bind(null, locale)}
      cancelHref={kind ? `/categories?kind=${kind}` : "/categories"}
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      {kind ? <input type="hidden" name="kind" value={kind} /> : null}
    </Confirm>
  );
}

export { DeleteCategory };
