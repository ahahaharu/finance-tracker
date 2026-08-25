"use client";

import { useFormatter, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

const CHART_HEIGHT = 160;
const TICK_INTERVAL = 6;
const dayFormat = { day: "numeric", month: "short" } as const;

type RegistrationPoint = {
  date: string;
  count: number;
};

type ChartBar = RegistrationPoint & { label: string };

function RegistrationsChart({
  points,
}: {
  points: readonly RegistrationPoint[];
}) {
  const formatter = useFormatter();
  const t = useTranslations("admin");
  const current = points.at(-1)?.date;
  const bars: ChartBar[] = points.map((point) => ({
    ...point,
    label: formatter.dateTime(new Date(`${point.date}T00:00:00`), dayFormat),
  }));

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={bars} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="label"
          interval={TICK_INTERVAL}
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
                <span className="text-12 text-ink">
                  {t("registrations.count", { count: bar.count })}
                </span>
              </div>
            );
          }}
        />
        <Bar dataKey="count" isAnimationActive={false}>
          {bars.map((bar) => (
            <Cell
              key={bar.date}
              fill={bar.date === current ? "var(--ink)" : "var(--ink-muted)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export { RegistrationsChart };
