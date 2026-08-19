import { getTranslations, setRequestLocale } from "next-intl/server";

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
import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { CategoryKind } from "@/lib/generated/prisma/enums";
import { listCategories } from "@/lib/services/category";
import { cn } from "@/lib/utils";

import { type CategoryFormErrorCode } from "./actions";
import { DeleteCategory } from "./delete-category";

type SearchParams = Record<string, string | string[] | undefined>;

type Failure = {
  code: CategoryFormErrorCode;
  categoryId: string;
  count: number;
};

const deleteErrorCodes: readonly CategoryFormErrorCode[] = [
  "CATEGORY_HAS_TRANSACTIONS",
  "NOT_FOUND",
];

const kinds = Object.values(CategoryKind);

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function readKind(query: SearchParams): CategoryKind | undefined {
  return kinds.find((kind) => kind === single(query.kind));
}

function readFailure(query: SearchParams): Failure | null {
  const code = deleteErrorCodes.find((known) => known === single(query.error));
  const categoryId = single(query.categoryId);

  if (!code || !categoryId) {
    return null;
  }

  return { code, categoryId, count: Number(single(query.count) ?? 0) };
}

export default async function CategoriesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/categories">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const user = await requireUser();
  const query = await searchParams;
  const kind = readKind(query);
  const [{ items }, t] = await Promise.all([
    listCategories(user.id, { kind }),
    getTranslations("categories"),
  ]);

  const failure = readFailure(query);

  return (
    <div className="flex flex-col gap-section">
      <div className="flex items-center justify-between">
        <h1 className="text-20 font-medium">{t("title")}</h1>
        <Link
          href={
            kind ? `/categories/new?kind=${kind}` : "/categories/new"
          }
          className={buttonVariants({ variant: "primary" })}
        >
          {t("add")}
        </Link>
      </div>

      <nav className="flex items-center gap-1">
        <Link
          href="/categories"
          aria-current={kind === undefined ? "page" : undefined}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            kind === undefined && "bg-sunken",
          )}
        >
          {t("filters.all")}
        </Link>
        {kinds.map((value) => (
          <Link
            key={value}
            href={`/categories?kind=${value}`}
            aria-current={kind === value ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              kind === value && "bg-sunken",
            )}
          >
            {t(`kinds.${value}`)}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <EmptyState message={t("empty")} />
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
    </div>
  );
}
