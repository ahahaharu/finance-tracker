import { format } from "date-fns";

import type { TransactionView } from "@/lib/services/transaction";

export const csvColumns = [
  "date",
  "time",
  "type",
  "amount",
  "currency",
  "baseAmount",
  "baseCurrency",
  "rate",
  "category",
  "wallet",
  "note",
] as const;

function minorToDecimal(minor: number): string {
  const digits = String(Math.abs(minor)).padStart(3, "0");
  const value = `${digits.slice(0, -2)}.${digits.slice(-2)}`;

  return minor < 0 ? `-${value}` : value;
}

function escape(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function toRow(transaction: TransactionView): string[] {
  return [
    format(transaction.occurredAt, "yyyy-MM-dd"),
    format(transaction.occurredAt, "HH:mm"),
    transaction.type,
    minorToDecimal(transaction.amount),
    transaction.currency,
    minorToDecimal(transaction.baseAmount),
    transaction.baseCurrency,
    transaction.rate,
    transaction.category?.name ?? "",
    transaction.wallet.name,
    transaction.note ?? "",
  ];
}

export function toCsv(transactions: readonly TransactionView[]): string {
  const rows = [
    [...csvColumns],
    ...transactions.map((transaction) => toRow(transaction)),
  ];

  return rows.map((row) => row.map(escape).join(",")).join("\r\n");
}
