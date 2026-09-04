import { getTranslations, setRequestLocale } from "next-intl/server";

import { RouteDialog } from "@/components/ui/dialog";
import { toLocale } from "@/i18n/routing";
import { CategoryKind } from "@/lib/generated/prisma/enums";
import { decodeFailure } from "@/lib/forms/state";

import { createCategoryAction } from "../../../categories/actions";
import { CategoryForm } from "../../../categories/category-form";
import { categoryFormErrorCodes } from "../../../categories/failure";

export default async function NewCategoryModal({
  params,
  searchParams,
}: PageProps<"/[locale]/categories/new">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const query = await searchParams;
  const requested = Array.isArray(query.kind) ? query.kind[0] : query.kind;
  const defaultKind = Object.values(CategoryKind).find(
    (kind) => kind === requested,
  );
  const t = await getTranslations("categories");

  return (
    <RouteDialog title={t("form.createTitle")} closeHref="/categories">
      <CategoryForm
        action={createCategoryAction.bind(null, locale)}
        defaultKind={defaultKind}
        initialState={decodeFailure(query, categoryFormErrorCodes)}
      />
    </RouteDialog>
  );
}
