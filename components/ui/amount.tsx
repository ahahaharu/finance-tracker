import { useLocale } from "next-intl";

import type { Currency, TransactionType } from "@/lib/generated/prisma/enums";
import { formatMoney } from "@/lib/format/money";
import { cn } from "@/lib/utils";

type AmountKind = TransactionType | "NET";

type AmountProps = {
  minor: number;
  currency: Currency;
  type?: AmountKind;
  baseMinor?: number;
  baseCurrency?: Currency;
  size?: "small" | "default" | "large" | "hero";
  className?: string;
};

const sizeClassName = {
  small: "text-12",
  default: "text-13",
  large: "text-32 leading-none",
  hero: "text-44 leading-none",
} as const;

const incoming: readonly AmountKind[] = ["INCOME", "TRANSFER_IN"];
const outgoing: readonly AmountKind[] = ["EXPENSE", "TRANSFER_OUT"];

function Amount({
  minor,
  currency,
  type,
  baseMinor,
  baseCurrency,
  size = "default",
  className,
}: AmountProps) {
  const locale = useLocale();
  const value = type === undefined ? minor : Math.abs(minor);

  let sign = "";
  let toneClassName = "text-ink";

  if (type === "NET") {
    if (minor !== 0) {
      sign = minor > 0 ? "+" : "−";
      toneClassName = minor > 0 ? "text-positive" : "text-negative";
    }
  } else if (type !== undefined && incoming.includes(type)) {
    sign = "+";
    toneClassName = "text-positive";
  } else if (type !== undefined && outgoing.includes(type)) {
    sign = "−";
    toneClassName = "text-negative";
  }

  return (
    <span
      className={cn(
        "inline-flex flex-col items-end font-mono tabular-nums",
        className,
      )}
    >
      <span className={cn(sizeClassName[size], toneClassName)}>
        {sign}
        {formatMoney(value, currency, locale)}
      </span>
      {baseMinor !== undefined && baseCurrency !== undefined ? (
        <span className="text-11 text-ink-faint">
          {formatMoney(baseMinor, baseCurrency, locale)}
        </span>
      ) : null}
    </span>
  );
}

export { Amount };
export type { AmountKind };
