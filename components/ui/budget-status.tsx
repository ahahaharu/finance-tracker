import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type BudgetStatusProps = {
  ratio: number;
  className?: string;
};

function BudgetStatus({ ratio, className }: BudgetStatusProps) {
  const t = useTranslations("budget");

  const state =
    ratio > 1 ? "exceeded" : ratio >= 0.8 ? "nearLimit" : "withinLimit";

  const toneClassName = {
    withinLimit: "bg-sunken text-ink-muted",
    nearLimit:
      "text-warning bg-[color-mix(in_oklch,var(--warning)_12%,transparent)]",
    exceeded:
      "text-negative bg-[color-mix(in_oklch,var(--negative)_12%,transparent)]",
  }[state];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius)] px-1.5 py-0.5 text-11",
        toneClassName,
        className,
      )}
    >
      {t(state)}
    </span>
  );
}

export { BudgetStatus };
