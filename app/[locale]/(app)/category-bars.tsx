"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export const BAR_ROW_HEIGHT = 24;

const BAR_HEIGHT = 14;

type CategoryBar = {
  categoryId: string;
  amount: number;
  color: string;
};

function fillOf(color: string): string {
  return `light-dark(${color}, color-mix(in oklch, ${color} 75%, white))`;
}

function CategoryBars({ items }: { items: readonly CategoryBar[] }) {
  return (
    <ResponsiveContainer width="100%" height={items.length * BAR_ROW_HEIGHT}>
      <BarChart
        data={[...items]}
        layout="vertical"
        barSize={BAR_HEIGHT}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="categoryId" hide width={0} />
        <Bar dataKey="amount" isAnimationActive={false}>
          {items.map((item) => (
            <Cell key={item.categoryId} fill={fillOf(item.color)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export { CategoryBars };
