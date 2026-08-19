import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { controlClassName } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { rangeKinds } from "@/lib/services/analytics";
import { cn } from "@/lib/utils";

import {
  currentPeriod,
  hasNext,
  isCurrent,
  periodQuery,
  type PeriodState,
  shiftPeriod,
  withRange,
} from "./period";

const dayFormat = { day: "numeric", month: "long", year: "numeric" } as const;
const monthFormat = { month: "long", year: "numeric" } as const;
const yearFormat = { year: "numeric" } as const;
const labelClassName = "flex flex-col gap-1.5 text-12 text-ink-muted";
const inlineLabelClassName = "flex items-center gap-2 text-12 text-ink-muted";

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

async function periodLabel(state: PeriodState): Promise<string> {
  const [t, formatter] = await Promise.all([
    getTranslations("dashboard"),
    getFormatter(),
  ]);
  const from = toDate(state.from);

  if (state.range === "day") {
    return formatter.dateTime(from, dayFormat);
  }

  if (state.range === "year") {
    return formatter.dateTime(from, yearFormat);
  }

  if (state.range === "custom") {
    return t("period.custom", {
      from: formatter.dateTime(from, dayFormat),
      to: formatter.dateTime(toDate(state.to), dayFormat),
    });
  }

  return formatter.dateTime(from, monthFormat);
}

async function RangeSwitch({
  state,
  now,
}: {
  state: PeriodState;
  now: string;
}) {
  const t = await getTranslations("dashboard");

  return (
    <div className="flex divide-x divide-line overflow-hidden rounded-[var(--radius)] border border-line">
      {rangeKinds.map((kind) => (
        <Link
          key={kind}
          href={{
            pathname: "/",
            query: periodQuery(withRange(state, kind, now)),
          }}
          aria-current={kind === state.range ? "true" : undefined}
          className={cn(
            "flex h-control items-center px-3 text-13 transition-opacity duration-[120ms] ease-out",
            kind === state.range
              ? "bg-sunken text-ink"
              : "text-ink-muted hover:text-ink",
          )}
        >
          {t(`ranges.${kind}`)}
        </Link>
      ))}
    </div>
  );
}

async function PeriodStepper({
  state,
  action,
  now,
}: {
  state: PeriodState;
  action: string;
  now: string;
}) {
  const [t, label] = await Promise.all([
    getTranslations("dashboard"),
    periodLabel(state),
  ]);
  const forward = hasNext(state, now);
  const currentLabel =
    state.range === "day"
      ? t("period.current.day")
      : state.range === "year"
        ? t("period.current.year")
        : t("period.current.month");

  return (
    <div className="flex items-center gap-1">
      <Link
        href={{ pathname: "/", query: periodQuery(shiftPeriod(state, -1, now)) }}
        aria-label={t("period.previous")}
        className={buttonVariants({ variant: "secondary", size: "icon" })}
      >
        <ChevronLeft />
      </Link>

      <details key={`${state.range}-${state.from}`} className="relative">
        <summary
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "w-56 cursor-default list-none justify-between text-14 [&::-webkit-details-marker]:hidden",
          )}
        >
          {label}
          <ChevronDown className="text-ink-muted" />
        </summary>

        <form
          action={action}
          method="get"
          className="absolute left-1/2 z-10 mt-1 flex -translate-x-1/2 flex-col gap-3 rounded-[var(--radius)] border border-line bg-surface p-3"
        >
          <input type="hidden" name="range" value={state.range} />
          <label className={labelClassName}>
            {t("period.jump")}
            <input
              type="date"
              name="from"
              max={now}
              defaultValue={state.from}
              className={cn(controlClassName, "w-44")}
            />
          </label>
          <button
            type="submit"
            className={buttonVariants({ variant: "primary" })}
          >
            {t("period.apply")}
          </button>
        </form>
      </details>

      {forward ? (
        <Link
          href={{ pathname: "/", query: periodQuery(shiftPeriod(state, 1, now)) }}
          aria-label={t("period.next")}
          className={buttonVariants({ variant: "secondary", size: "icon" })}
        >
          <ChevronRight />
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            buttonVariants({ variant: "secondary", size: "icon" }),
            "text-ink-faint opacity-50",
          )}
        >
          <ChevronRight />
        </span>
      )}

      <span className="ml-2 flex w-28 justify-start">
        {isCurrent(state, now) ? null : (
          <Link
            href={{
              pathname: "/",
              query: periodQuery(currentPeriod(state.range, now)),
            }}
            className={buttonVariants({ variant: "ghost" })}
          >
            {currentLabel}
          </Link>
        )}
      </span>
    </div>
  );
}

async function CustomRange({
  state,
  action,
  now,
}: {
  state: PeriodState;
  action: string;
  now: string;
}) {
  const t = await getTranslations("dashboard");

  return (
    <form action={action} method="get" className="flex items-center gap-2">
      <input type="hidden" name="range" value="custom" />
      <label className={inlineLabelClassName}>
        {t("period.from")}
        <input
          type="date"
          name="from"
          max={now}
          defaultValue={state.from}
          className={cn(controlClassName, "w-40")}
        />
      </label>
      <label className={inlineLabelClassName}>
        {t("period.to")}
        <input
          type="date"
          name="to"
          max={now}
          defaultValue={state.to}
          className={cn(controlClassName, "w-40")}
        />
      </label>
      <button type="submit" className={buttonVariants({ variant: "primary" })}>
        {t("period.apply")}
      </button>
    </form>
  );
}

function PeriodBar({
  state,
  action,
  now,
}: {
  state: PeriodState;
  action: string;
  now: string;
}) {
  return (
    <div className="flex min-h-control flex-wrap items-center justify-center gap-4">
      <RangeSwitch state={state} now={now} />
      {state.range === "custom" ? (
        <CustomRange state={state} action={action} now={now} />
      ) : (
        <PeriodStepper state={state} action={action} now={now} />
      )}
    </div>
  );
}

export { PeriodBar };
