import { getFormatter, getTranslations } from "next-intl/server";

import { Amount } from "@/components/ui/amount";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Currency } from "@/lib/generated/prisma/enums";
import { transactionContext } from "@/lib/services/transaction";
import { getTransfer } from "@/lib/services/transfer";
import { cn } from "@/lib/utils";

const momentFormat = {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
} as const;

async function TransferDetails({
  groupId,
  transactionId,
  userId,
  baseCurrency,
}: {
  groupId: string;
  transactionId: string;
  userId: string;
  baseCurrency: Currency;
}) {
  const transfer = await getTransfer(
    userId,
    groupId,
    transactionContext({ baseCurrency }),
  );
  const [t, formatter] = await Promise.all([
    getTranslations("transfers"),
    getFormatter(),
  ]);

  return (
    <div className="flex flex-col gap-section">
      <h1 className="text-20 font-medium">{t("detailsTitle")}</h1>

      <dl className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <dt className="w-40 text-12 text-ink-muted">{t("fields.from")}</dt>
          <dd className="flex items-baseline gap-3 text-13">
            {transfer.from.walletName}
            <Amount
              minor={transfer.from.amount}
              currency={transfer.from.currency}
              type="TRANSFER_OUT"
            />
          </dd>
        </div>
        <div className="flex items-baseline gap-3">
          <dt className="w-40 text-12 text-ink-muted">{t("fields.to")}</dt>
          <dd className="flex items-baseline gap-3 text-13">
            {transfer.to.walletName}
            <Amount
              minor={transfer.to.amount}
              currency={transfer.to.currency}
              type="TRANSFER_IN"
            />
          </dd>
        </div>
        {transfer.rate ? (
          <div className="flex gap-3">
            <dt className="w-40 text-12 text-ink-muted">{t("fields.rate")}</dt>
            <dd className="font-mono text-13 tabular-nums">{transfer.rate}</dd>
          </div>
        ) : null}
        <div className="flex gap-3">
          <dt className="w-40 text-12 text-ink-muted">
            {t("fields.occurredAt")}
          </dt>
          <dd className="text-13">
            {formatter.dateTime(transfer.occurredAt, momentFormat)}
          </dd>
        </div>
        {transfer.note ? (
          <div className="flex gap-3">
            <dt className="w-40 text-12 text-ink-muted">{t("fields.note")}</dt>
            <dd className="text-13">{transfer.note}</dd>
          </div>
        ) : null}
      </dl>

      <p className="text-12 text-ink-muted">{t("editHint")}</p>

      <Link
        href={`/transactions/${transactionId}/delete`}
        className={cn(buttonVariants({ variant: "destructive" }), "w-fit")}
      >
        {t("actions.delete")}
      </Link>
    </div>
  );
}

export { TransferDetails };
