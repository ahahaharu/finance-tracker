import { getTranslations } from "next-intl/server";

import { Amount } from "@/components/ui/amount";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionTitle } from "@/components/ui/section-title";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getPeriodTotals, type Period } from "@/lib/services/analytics";
import { balanceOptions, listWallets } from "@/lib/services/wallet";

async function OverviewSummary({ period }: { period: Period }) {
  const user = await requireUser();
  const options = balanceOptions(user);
  const [{ items, totalBalance }, totals, t] = await Promise.all([
    listWallets(user.id, options),
    getPeriodTotals(user.id, options.baseCurrency, period),
    getTranslations("dashboard"),
  ]);

  return (
    <div className="flex flex-col gap-section">
      <div className="flex flex-col gap-1 border border-line bg-surface p-4">
        <span className="text-12 text-ink-muted">{t("balance")}</span>
        <Amount
          minor={totalBalance.amount}
          currency={totalBalance.currency}
          size="hero"
          className="items-start"
        />
        <span className="flex items-baseline gap-2 text-12 text-ink-muted">
          {t("delta")}
          <Amount
            minor={totals.net}
            currency={totals.currency}
            type="NET"
            size="small"
          />
        </span>
        {totalBalance.complete ? null : (
          <span className="text-12 text-ink-faint">
            {t("balanceIncomplete")}
          </span>
        )}
      </div>

      <dl className="flex divide-x divide-line">
        <div className="flex flex-1 flex-col gap-1 pr-6">
          <dt className="text-12 text-ink-muted">{t("figures.income")}</dt>
          <dd>
            <Amount
              minor={totals.income}
              currency={totals.currency}
              size="large"
              className="items-start"
            />
          </dd>
        </div>
        <div className="flex flex-1 flex-col gap-1 px-6">
          <dt className="text-12 text-ink-muted">{t("figures.expense")}</dt>
          <dd>
            <Amount
              minor={totals.expense}
              currency={totals.currency}
              size="large"
              className="items-start"
            />
          </dd>
        </div>
        <div className="flex flex-1 flex-col gap-1 pl-6">
          <dt className="text-12 text-ink-muted">{t("figures.net")}</dt>
          <dd>
            <Amount
              minor={totals.net}
              currency={totals.currency}
              type="NET"
              size="large"
              className="items-start"
            />
          </dd>
        </div>
      </dl>

      <section className="flex flex-col gap-3">
        <SectionTitle>{t("sections.wallets")}</SectionTitle>

        {items.length === 0 ? (
          <EmptyState
            message={t("empty.wallets")}
            action={
              <Link
                href="/wallets/new"
                className={buttonVariants({ variant: "secondary" })}
              >
                {t("actions.addWallet")}
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col">
            {items.map((wallet) => (
              <li
                key={wallet.id}
                className="flex items-center justify-between gap-4 border-b border-line py-3"
              >
                <Link
                  href={`/wallets/${wallet.id}`}
                  className="text-13 text-ink underline underline-offset-2"
                >
                  {wallet.name}
                </Link>
                <Amount
                  minor={wallet.currentBalance}
                  currency={wallet.currency}
                  baseMinor={
                    wallet.currency === wallet.baseCurrency ||
                    wallet.baseBalance === null
                      ? undefined
                      : wallet.baseBalance
                  }
                  baseCurrency={wallet.baseCurrency}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export { OverviewSummary };
