import { getTranslations, setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";
import { CategoryKind } from "@/lib/generated/prisma/enums";

import { decodeFailure } from "@/lib/forms/state";

import { createCategoryAction } from "../actions";
import { categoryFormErrorCodes } from "../failure";
import { CategoryForm } from "../category-form";

export default async function NewCategoryPage({
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
    <div className="flex flex-col gap-section">
      <h1 className="text-20 font-medium">{t("form.createTitle")}</h1>
      <CategoryForm
        action={createCategoryAction.bind(null, locale)}
        defaultKind={defaultKind}
        initialState={decodeFailure(query, categoryFormErrorCodes)}
      />
    </div>
  );
}
