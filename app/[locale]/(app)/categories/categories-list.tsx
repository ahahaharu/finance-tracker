import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { LinkPending } from "@/components/ui/link-pending";
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

async function CategoriesList({ kind }: { kind?: CategoryKind }) {
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
                <TableCell className="text-right">
                  <Link
                    href={
                      kind
                        ? `/categories/${category.id}/delete?kind=${kind}`
                        : `/categories/${category.id}/delete`
                    }
                    className={buttonVariants({ variant: "destructive" })}
                  >
                    {t("actions.delete")}
                    <LinkPending />
                  </Link>
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
