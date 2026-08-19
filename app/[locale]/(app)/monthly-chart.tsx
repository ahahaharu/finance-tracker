"use client";

import { useFormatter } from "next-intl";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { Amount } from "@/components/ui/amount";
import type { Currency } from "@/lib/generated/prisma/enums";

const CHART_HEIGHT = 160;
const monthFormat = { month: "short" } as const;

type MonthlyChartPoint = {
  month: string;
  expense: number;
  currency: Currency;
};

type ChartBar = MonthlyChartPoint & { label: string };

function MonthlyChart({ points }: { points: readonly MonthlyChartPoint[] }) {
  const formatter = useFormatter();
  const current = points.at(-1)?.month;
  const bars: ChartBar[] = points.map((point) => ({
    ...point,
    label: formatter.dateTime(
      new Date(`${point.month}-01T00:00:00`),
      monthFormat,
    ),
  }));

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={bars} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: "var(--sunken)" }}
          content={({ active, payload }) => {
            const bar = payload?.[0]?.payload as ChartBar | undefined;

            if (!active || !bar) {
              return null;
            }

            return (
              <div className="flex items-baseline gap-2 border border-line bg-surface px-2 py-1">
                <span className="text-12 text-ink-muted">{bar.label}</span>
                <Amount
                  minor={bar.expense}
                  currency={bar.currency}
                  type="EXPENSE"
                  size="small"
                />
              </div>
            );
          }}
        />
        <Bar dataKey="expense" isAnimationActive={false}>
          {bars.map((bar) => (
            <Cell
              key={bar.month}
              fill={bar.month === current ? "var(--ink)" : "var(--ink-muted)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export { MonthlyChart };
export type { MonthlyChartPoint };
