import { describe, expect, it } from "vitest";

import { formatMoney, parseMoney, toMoneyInput } from "./money";

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

describe("parseMoney", () => {
  it("reads both decimal separators", () => {
    expect(parseMoney("123.45")).toBe(12345);
    expect(parseMoney("123,45")).toBe(12345);
  });

  it("pads a single fraction digit", () => {
    expect(parseMoney("7,5")).toBe(750);
  });

  it("reads a whole amount without a fraction", () => {
    expect(parseMoney("40")).toBe(4000);
    expect(parseMoney("0")).toBe(0);
  });

  it("ignores spaces used as group separators", () => {
    expect(parseMoney(`1${NBSP}234,56`)).toBe(123456);
    expect(parseMoney(" 12 345 ")).toBe(1234500);
  });

  it("reads both minus signs", () => {
    expect(parseMoney("-8,20")).toBe(-820);
    expect(parseMoney(`${MINUS}8,20`)).toBe(-820);
  });

  it("rejects more than two fraction digits", () => {
    expect(parseMoney("1,234")).toBeNull();
  });

  it("rejects text, empty input and a lone separator", () => {
    expect(parseMoney("")).toBeNull();
    expect(parseMoney(",")).toBeNull();
    expect(parseMoney("1e3")).toBeNull();
    expect(parseMoney("сорок")).toBeNull();
  });

  it("rejects an amount that cannot be held exactly", () => {
    expect(parseMoney("999999999999999999")).toBeNull();
  });
});

describe("toMoneyInput", () => {
  it("renders minor units with a dot and two digits", () => {
    expect(toMoneyInput(12345)).toBe("123.45");
    expect(toMoneyInput(5)).toBe("0.05");
    expect(toMoneyInput(0)).toBe("0.00");
    expect(toMoneyInput(-820)).toBe("-8.20");
  });

  it("survives a round trip through parseMoney", () => {
    expect(parseMoney(toMoneyInput(-123456))).toBe(-123456);
  });
});
