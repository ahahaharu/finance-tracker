import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { deleteCategoryAction } from "./actions";

async function DeleteCategory({
  categoryId,
  kind,
  locale,
}: {
  categoryId: string;
  kind?: string;
  locale: Locale;
}) {
  const t = await getTranslations("categories");

  return (
    <details className="group flex items-center justify-end gap-1">
      <summary
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "cursor-default list-none [&::-webkit-details-marker]:hidden",
        )}
      >
        <span className="group-open:hidden">{t("actions.delete")}</span>
        <span className="hidden group-open:inline">{t("actions.cancel")}</span>
      </summary>
      <form action={deleteCategoryAction.bind(null, locale)}>
        <input type="hidden" name="categoryId" value={categoryId} />
        {kind ? <input type="hidden" name="kind" value={kind} /> : null}
        <Button type="submit" variant="destructive">
          {t("actions.confirmDelete")}
        </Button>
      </form>
    </details>
  );
}

export { DeleteCategory };
