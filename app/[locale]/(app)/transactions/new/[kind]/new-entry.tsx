import { format } from "date-fns";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { LinkPending } from "@/components/ui/link-pending";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import { decodeFailure, type SearchParams } from "@/lib/forms/state";
import { listCategories } from "@/lib/services/category";
import { balanceOptions, listWallets } from "@/lib/services/wallet";
import { cn } from "@/lib/utils";

import { createTransactionAction } from "../../actions";
import { transactionFormErrorCodes } from "../../failure";
import { TransactionForm } from "../../transaction-form";
import { createTransferAction } from "../../transfer/actions";
import { transferFormErrorCodes } from "../../transfer/failure";
import { TransferForm } from "../../transfer/transfer-form";
import { type EntryKind, entryKinds, kindPath } from "../kind";

async function KindSwitch({ kind }: { kind: EntryKind }) {
  const t = await getTranslations("transactions");

  return (
    <nav className="flex divide-x divide-line overflow-hidden rounded-[var(--radius)] border border-line">
      {entryKinds.map((value) => (
        <Link
          key={value}
          href={`/transactions/new/${kindPath(value)}`}
          replace
          scroll={false}
          aria-current={value === kind ? "page" : undefined}
          className={cn(
            "flex h-control flex-1 items-center justify-center text-13 transition-opacity duration-[120ms] ease-out",
            value === kind
              ? "bg-sunken text-ink"
              : "text-ink-muted hover:text-ink",
          )}
        >
          <span className="flex items-center gap-2">
            {t(`types.${value}`)}
            <LinkPending />
          </span>
        </Link>
      ))}
    </nav>
  );
}

async function NewEntry({
  locale,
  kind,
  query,
}: {
  locale: Locale;
  kind: EntryKind;
  query: SearchParams;
}) {
  const user = await requireUser();
  const [wallets, categories, t, walletsText, categoriesText] =
    await Promise.all([
      listWallets(user.id, balanceOptions(user)),
      listCategories(user.id),
      getTranslations("transactions"),
      getTranslations("wallets"),
      getTranslations("categories"),
    ]);

  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const addWallet = (
    <Link
      href="/wallets/new"
      className={buttonVariants({ variant: "secondary" })}
    >
      {walletsText("add")}
    </Link>
  );

  return (
    <div className="flex flex-col gap-4">
      <KindSwitch kind={kind} />

      {kind === "TRANSFER" ? (
        wallets.items.length < 2 ? (
          <EmptyState message={t("needsTwoWallets")} action={addWallet} />
        ) : (
          <TransferForm
            action={createTransferAction.bind(null, locale)}
            wallets={wallets.items}
            now={now}
            initialState={decodeFailure(query, transferFormErrorCodes)}
          />
        )
      ) : wallets.items.length === 0 ? (
        <EmptyState message={t("needsWallet")} action={addWallet} />
      ) : categories.items.length === 0 ? (
        <EmptyState
          message={t("needsCategory")}
          action={
            <Link
              href="/categories/new"
              className={buttonVariants({ variant: "secondary" })}
            >
              {categoriesText("add")}
            </Link>
          }
        />
      ) : (
        <TransactionForm
          action={createTransactionAction.bind(null, locale)}
          wallets={wallets.items}
          categories={categories.items}
          fixedType={kind}
          now={now}
          initialState={decodeFailure(query, transactionFormErrorCodes)}
        />
      )}
    </div>
  );
}

export { NewEntry };
