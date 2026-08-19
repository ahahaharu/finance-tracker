import { describe, expect, it } from "vitest";

import { csvColumns, toCsv } from "@/lib/services/transaction-csv";
import type { TransactionView } from "@/lib/services/transaction";

function view(overrides: Partial<TransactionView> = {}): TransactionView {
  return {
    id: "txn_1",
    type: "EXPENSE",
    amount: 12_345,
    currency: "USD",
    baseAmount: 40_063,
    baseCurrency: "BYN",
    rate: "3.24560000",
    rateDate: new Date("2026-08-18T00:00:00.000Z"),
    occurredAt: new Date("2026-08-18T09:05:00"),
    note: null,
    wallet: { id: "wal_1", name: "Наличные" },
    category: { id: "cat_1", name: "Продукты", color: "#8c6a4a" },
    ...overrides,
  };
}

function rows(csv: string): string[] {
  return csv.split("\r\n");
}

describe("toCsv", () => {
  it("starts with the header row", () => {
    expect(rows(toCsv([]))[0]).toBe(csvColumns.join(","));
  });

  it("writes amounts as decimals, not as minor units", () => {
    expect(rows(toCsv([view()]))[1]).toContain("123.45");
    expect(rows(toCsv([view()]))[1]).toContain("400.63");
  });

  it("splits the moment into a date and a time", () => {
    const [, row] = rows(toCsv([view()]));

    expect(row.startsWith("2026-08-18,09:05,EXPENSE,")).toBe(true);
  });

  it("keeps a negative amount signed", () => {
    expect(rows(toCsv([view({ amount: 5, baseAmount: -5 })]))[1]).toContain(
      "-0.05",
    );
  });

  it("quotes a note that contains a comma", () => {
    expect(rows(toCsv([view({ note: "Кофе, булка" })]))[1]).toContain(
      '"Кофе, булка"',
    );
  });

  it("doubles quotation marks inside a note", () => {
    expect(rows(toCsv([view({ note: 'Магазин "Пятёрочка"' })]))[1]).toContain(
      '"Магазин ""Пятёрочка"""',
    );
  });

  it("quotes a note that spans several lines", () => {
    const [, row] = rows(toCsv([view({ note: "Первая\nвторая" })]));

    expect(row).toContain('"Первая');
  });

  it("leaves an empty cell for a transfer without a category", () => {
    const [, row] = rows(
      toCsv([view({ category: null, type: "TRANSFER_OUT" })]),
    );

    expect(row.endsWith(",,Наличные,")).toBe(true);
  });

  it("writes one row per transaction", () => {
    expect(rows(toCsv([view(), view({ id: "txn_2" })]))).toHaveLength(3);
  });
});
