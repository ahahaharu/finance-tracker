import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { controlClassName } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import { filterTypes, type TransactionFilterInput } from "@/lib/schemas/transaction";
import { listCategories } from "@/lib/services/category";
import { balanceOptions, listWallets } from "@/lib/services/wallet";
import { cn } from "@/lib/utils";

const labelClassName = "flex flex-col gap-1.5 text-12 text-ink-muted";
const fieldWidths = ["w-40", "w-40", "w-44", "w-44", "w-36", "w-48", "w-44"];

function FilterBarFallback() {
  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-line pb-4">
      {fieldWidths.map((width) => (
        <div key={width} className="flex flex-col gap-1.5">
          <span className="h-3 w-16 rounded-[var(--radius)] bg-sunken" />
          <span
            className={cn("h-control rounded-[var(--radius)] bg-sunken", width)}
          />
        </div>
      ))}
    </div>
  );
}

async function FilterBar({
  filter,
  action,
}: {
  filter: TransactionFilterInput;
  action: string;
}) {
  const user = await requireUser();
  const [wallets, categories, t] = await Promise.all([
    listWallets(user.id, balanceOptions(user)),
    listCategories(user.id),
    getTranslations("transactions"),
  ]);

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
          {wallets.items.map((wallet) => (
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
          {categories.items.map((category) => (
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
    </form>
  );
}

export { FilterBar, FilterBarFallback };
