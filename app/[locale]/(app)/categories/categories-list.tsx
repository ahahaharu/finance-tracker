import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { CategoryDot } from "@/components/ui/category-dot";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import type { CategoryKind } from "@/lib/generated/prisma/enums";
import { listCategories } from "@/lib/services/category";

import { DeleteCategory } from "./delete-category";
import type { Failure } from "./failure";

async function CategoriesList({
  locale,
  kind,
  failure,
}: {
  locale: Locale;
  kind?: CategoryKind;
  failure: Failure | null;
}) {
  const user = await requireUser();
  const [{ items }, t] = await Promise.all([
    listCategories(user.id, { kind }),
    getTranslations("categories"),
  ]);

  return (
    <>
      {items.length === 0 ? (
        <EmptyState
          message={t("empty")}
          action={
            <Link
              href={kind ? `/categories/new?kind=${kind}` : "/categories/new"}
              className={buttonVariants({ variant: "secondary" })}
            >
              {t("add")}
            </Link>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-sunken">
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.kind")}</TableHead>
              <TableHead>
                <span className="sr-only">{t("columns.actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <CategoryDot color={category.color} />
                    <Link
                      href={`/categories/${category.id}`}
                      className="text-ink underline underline-offset-2"
                    >
                      {category.name}
                    </Link>
                  </span>
                </TableCell>
                <TableCell className="text-ink-muted">
                  {t(`kinds.${category.kind}`)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-end gap-1">
                    <DeleteCategory
                      categoryId={category.id}
                      kind={kind}
                      locale={locale}
                    />
                    {failure?.categoryId === category.id ? (
                      <p className="text-12 text-negative">
                        {failure.code === "CATEGORY_HAS_TRANSACTIONS"
                          ? t("errors.CATEGORY_HAS_TRANSACTIONS", {
                              count: failure.count,
                            })
                          : t(`errors.${failure.code}`)}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}

export { CategoriesList };
