import { describe, expect, it } from "vitest";

import { formatMoney } from "./money";

const NBSP = " ";
const MINUS = "−";

describe("formatMoney", () => {
  it("renders minor units as a fraction", () => {
    expect(formatMoney(12345, "BYN", "ru")).toBe(`123,45${NBSP}BYN`);
  });

  it("keeps a leading zero for amounts below one unit", () => {
    expect(formatMoney(5, "BYN", "ru")).toBe(`0,05${NBSP}BYN`);
    expect(formatMoney(99, "BYN", "ru")).toBe(`0,99${NBSP}BYN`);
  });

  it("renders zero with two fraction digits", () => {
    expect(formatMoney(0, "EUR", "ru")).toBe(`0,00${NBSP}€`);
  });

  it("prefixes negative amounts with a minus sign", () => {
    expect(formatMoney(-99, "BYN", "ru")).toBe(`${MINUS}0,99${NBSP}BYN`);
    expect(formatMoney(-12345, "USD", "en")).toBe(`${MINUS}$123.45`);
  });

  it("follows the locale for separators and currency placement", () => {
    expect(formatMoney(5000, "USD", "ru")).toBe(`50,00${NBSP}$`);
    expect(formatMoney(5000, "USD", "en")).toBe("$50.00");
  });

  it("does not lose precision on large amounts", () => {
    expect(formatMoney(123456789012345, "BYN", "en")).toBe(
      `BYN${NBSP}1,234,567,890,123.45`,
    );
  });

  it("groups thousands", () => {
    expect(formatMoney(100000000, "EUR", "en")).toBe("€1,000,000.00");
  });
});
