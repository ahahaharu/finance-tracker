import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { controlClassName } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { filterTypes, type TransactionFilterInput } from "@/lib/schemas/transaction";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

const labelClassName = "flex flex-col gap-1.5 text-12 text-ink-muted";

async function FilterBar({
  filter,
  wallets,
  categories,
  action,
  exportHref,
}: {
  filter: TransactionFilterInput;
  wallets: readonly Option[];
  categories: readonly Option[];
  action: string;
  exportHref: string;
}) {
  const t = await getTranslations("transactions");

  return (
    <form
      action={action}
      method="get"
      className="flex flex-wrap items-end gap-3 border-b border-line pb-4"
    >
      <label className={labelClassName}>
        {t("filters.from")}
        <input
          type="date"
          name="from"
          defaultValue={filter.from ?? ""}
          className={cn(controlClassName, "w-40")}
        />
      </label>

      <label className={labelClassName}>
        {t("filters.to")}
        <input
          type="date"
          name="to"
          defaultValue={filter.to ?? ""}
          className={cn(controlClassName, "w-40")}
        />
      </label>

      <label className={labelClassName}>
        {t("filters.wallet")}
        <select
          name="walletId"
          defaultValue={filter.walletId?.[0] ?? ""}
          className={cn(controlClassName, "w-44")}
        >
          <option value="">{t("filters.any")}</option>
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        {t("filters.category")}
        <select
          name="categoryId"
          defaultValue={filter.categoryId?.[0] ?? ""}
          className={cn(controlClassName, "w-44")}
        >
          <option value="">{t("filters.any")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        {t("filters.type")}
        <select
          name="type"
          defaultValue={filter.type ?? ""}
          className={cn(controlClassName, "w-36")}
        >
          <option value="">{t("filters.any")}</option>
          {filterTypes.map((type) => (
            <option key={type} value={type}>
              {t(`filterTypes.${type}`)}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        {t("filters.query")}
        <input
          type="search"
          name="q"
          defaultValue={filter.q ?? ""}
          placeholder={t("filters.queryPlaceholder")}
          className={cn(controlClassName, "w-48")}
        />
      </label>

      <label className={labelClassName}>
        {t("filters.sort")}
        <select
          name="sort"
          defaultValue={filter.sort}
          className={cn(controlClassName, "w-44")}
        >
          <option value="occurredAt:desc">{t("filters.newestFirst")}</option>
          <option value="occurredAt:asc">{t("filters.oldestFirst")}</option>
        </select>
      </label>

      <button type="submit" className={buttonVariants({ variant: "secondary" })}>
        {t("filters.apply")}
      </button>

      <Link href="/transactions" className={buttonVariants({ variant: "ghost" })}>
        {t("filters.reset")}
      </Link>

      <a href={exportHref} className={buttonVariants({ variant: "ghost" })}>
        {t("filters.export")}
      </a>
    </form>
  );
}

export { FilterBar };
