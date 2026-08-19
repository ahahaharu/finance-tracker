import { beforeEach, describe, expect, it, vi } from "vitest";

import { RateNotAvailableError } from "@/lib/errors";
import type { ExchangeRate } from "@/lib/generated/prisma/client";
import type { Currency } from "@/lib/generated/prisma/enums";
import type { NewExchangeRate } from "@/lib/repositories/exchange-rate";
import {
  applyRate,
  convertAmount,
  crossRate,
  divideHalfUp,
  findConversion,
  formatRate,
  listRates,
  parseRate,
  refreshRates,
} from "@/lib/services/exchange-rate";

const repository = vi.hoisted(() => ({
  findLatestOnOrBefore: vi.fn(),
  listLatestOnOrBefore: vi.fn(),
  saveMany: vi.fn(),
}));

vi.mock("@/lib/repositories/exchange-rate", () => ({
  exchangeRateRepository: repository,
}));

const TODAY = new Date("2026-08-19T10:00:00.000Z");

function utc(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function rateFixture(
  fromCurrency: Currency,
  rate: string,
  date: string,
): ExchangeRate {
  return {
    id: `rate_${fromCurrency}_${date}`,
    date: utc(date),
    fromCurrency,
    toCurrency: "BYN",
    rate: { toFixed: () => rate } as unknown as ExchangeRate["rate"],
    fetchedAt: utc(date),
  };
}

function storedRates(rates: Record<string, ExchangeRate | null>) {
  repository.findLatestOnOrBefore.mockImplementation((currency: Currency) =>
    Promise.resolve(rates[currency] ?? null),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  repository.findLatestOnOrBefore.mockResolvedValue(null);
  repository.listLatestOnOrBefore.mockResolvedValue([]);
  repository.saveMany.mockImplementation((rates: NewExchangeRate[]) =>
    Promise.resolve(rates.length),
  );
});

describe("parseRate and formatRate", () => {
  it("keeps eight decimal places", () => {
    expect(parseRate("3.2456")).toBe(324560000n);
    expect(formatRate(324560000n)).toBe("3.24560000");
  });

  it("reads a whole number", () => {
    expect(parseRate("3")).toBe(300000000n);
    expect(formatRate(300000000n)).toBe("3.00000000");
  });

  it("survives a round trip", () => {
    expect(formatRate(parseRate("0.00000001"))).toBe("0.00000001");
  });

  it("rejects text", () => {
    expect(() => parseRate("три")).toThrow(TypeError);
  });
});

describe("divideHalfUp", () => {
  it("rounds a half away from zero", () => {
    expect(divideHalfUp(5n, 2n)).toBe(3n);
    expect(divideHalfUp(-5n, 2n)).toBe(-3n);
  });

  it("keeps values below a half", () => {
    expect(divideHalfUp(4n, 3n)).toBe(1n);
    expect(divideHalfUp(-4n, 3n)).toBe(-1n);
  });

  it("rounds values above a half", () => {
    expect(divideHalfUp(5n, 3n)).toBe(2n);
    expect(divideHalfUp(-5n, 3n)).toBe(-2n);
  });

  it("divides exactly when there is no remainder", () => {
    expect(divideHalfUp(6n, 3n)).toBe(2n);
  });
});

describe("applyRate", () => {
  it("rounds a half up to the minor unit", () => {
    expect(applyRate(1, parseRate("1.005"))).toBe(1);
    expect(applyRate(100, parseRate("1.005"))).toBe(101);
    expect(applyRate(10, parseRate("0.125"))).toBe(1);
    expect(applyRate(10, parseRate("0.15"))).toBe(2);
  });

  it("treats a negative amount symmetrically", () => {
    expect(applyRate(-100, parseRate("1.005"))).toBe(-101);
    expect(applyRate(-10, parseRate("0.15"))).toBe(-2);
  });

  it("keeps zero at zero", () => {
    expect(applyRate(0, parseRate("3.2456"))).toBe(0);
  });

  it("does not lose precision on large amounts", () => {
    expect(applyRate(2_000_000_000, parseRate("3.2456"))).toBe(6_491_200_000);
  });
});

describe("crossRate", () => {
  it("computes a rate through the base currency", () => {
    expect(formatRate(crossRate(parseRate("3.24"), parseRate("3.60")))).toBe(
      "0.90000000",
    );
  });

  it("rounds the eighth decimal place half up", () => {
    expect(formatRate(crossRate(parseRate("1"), parseRate("3")))).toBe(
      "0.33333333",
    );
    expect(formatRate(crossRate(parseRate("2"), parseRate("3")))).toBe(
      "0.66666667",
    );
  });
});

describe("findConversion", () => {
  it("returns a rate of one for the same currency without touching the database", async () => {
    const conversion = await findConversion({
      from: "BYN",
      to: "BYN",
      on: TODAY,
    });

    expect(conversion?.rate).toBe("1.00000000");
    expect(repository.findLatestOnOrBefore).not.toHaveBeenCalled();
  });

  it("converts a foreign currency into the base one", async () => {
    storedRates({ USD: rateFixture("USD", "3.24560000", "2026-08-19") });

    const conversion = await findConversion({
      from: "USD",
      to: "BYN",
      on: TODAY,
    });

    expect(conversion).toEqual({
      rate: "3.24560000",
      rateDate: utc("2026-08-19"),
    });
  });

  it("computes a cross rate through the base currency", async () => {
    storedRates({
      USD: rateFixture("USD", "3.24000000", "2026-08-19"),
      EUR: rateFixture("EUR", "3.60000000", "2026-08-19"),
    });

    const conversion = await findConversion({
      from: "USD",
      to: "EUR",
      on: TODAY,
    });

    expect(conversion?.rate).toBe("0.90000000");
  });

  it("asks for the rate on the requested calendar day", async () => {
    storedRates({ USD: rateFixture("USD", "3.24560000", "2026-08-17") });

    await findConversion({ from: "USD", to: "BYN", on: TODAY });

    expect(repository.findLatestOnOrBefore).toHaveBeenCalledWith(
      "USD",
      utc("2026-08-19"),
    );
  });

  it("falls back to the nearest preceding rate and reports its date", async () => {
    storedRates({ USD: rateFixture("USD", "3.20000000", "2026-08-15") });

    const conversion = await findConversion({
      from: "USD",
      to: "BYN",
      on: TODAY,
    });

    expect(conversion).toEqual({
      rate: "3.20000000",
      rateDate: utc("2026-08-15"),
    });
  });

  it("reports the earlier date when the two sides come from different days", async () => {
    storedRates({
      USD: rateFixture("USD", "3.24000000", "2026-08-15"),
      EUR: rateFixture("EUR", "3.60000000", "2026-08-19"),
    });

    const conversion = await findConversion({
      from: "USD",
      to: "EUR",
      on: TODAY,
    });

    expect(conversion?.rateDate).toEqual(utc("2026-08-15"));
  });

  it("returns nothing when no rate exists at all", async () => {
    storedRates({});

    await expect(
      findConversion({ from: "USD", to: "BYN", on: TODAY }),
    ).resolves.toBeNull();
  });
});

describe("convertAmount", () => {
  it("converts and reports the rate it used", async () => {
    storedRates({ USD: rateFixture("USD", "3.24560000", "2026-08-19") });

    await expect(
      convertAmount({ amount: 10_000, from: "USD", to: "BYN", on: TODAY }),
    ).resolves.toEqual({
      amount: 32_456,
      rate: "3.24560000",
      rateDate: utc("2026-08-19"),
    });
  });

  it("rejects an amount it cannot convert", async () => {
    storedRates({});

    await expect(
      convertAmount({ amount: 10_000, from: "USD", to: "BYN", on: TODAY }),
    ).rejects.toThrow(RateNotAvailableError);
  });
});

describe("listRates", () => {
  it("reports the rates effective on the requested day", async () => {
    repository.listLatestOnOrBefore.mockResolvedValue([
      rateFixture("USD", "3.24560000", "2026-08-18"),
    ]);

    await expect(listRates(TODAY)).resolves.toEqual([
      {
        fromCurrency: "USD",
        toCurrency: "BYN",
        rate: "3.24560000",
        date: utc("2026-08-18"),
      },
    ]);
    expect(repository.listLatestOnOrBefore).toHaveBeenCalledWith(
      utc("2026-08-19"),
    );
  });
});

describe("refreshRates", () => {
  const published = [
    { Cur_Abbreviation: "USD", Cur_OfficialRate: 3.2456, Cur_Scale: 1 },
    { Cur_Abbreviation: "EUR", Cur_OfficialRate: 3.6012, Cur_Scale: 1 },
    { Cur_Abbreviation: "RUB", Cur_OfficialRate: 3.4567, Cur_Scale: 100 },
  ];

  function respondWith(body: unknown, ok = true) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok,
        status: ok ? 200 : 503,
        json: () => Promise.resolve(body),
      }),
    );
  }

  it("stores only the tracked currencies against the base one", async () => {
    respondWith(published);

    const result = await refreshRates({ from: TODAY, to: TODAY });

    expect(result).toEqual({ dates: 1, rates: 2 });
    expect(repository.saveMany).toHaveBeenCalledWith([
      { date: utc("2026-08-19"), fromCurrency: "USD", rate: "3.24560000" },
      { date: utc("2026-08-19"), fromCurrency: "EUR", rate: "3.60120000" },
    ]);
  });

  it("normalises a rate published for several units", async () => {
    respondWith([
      { Cur_Abbreviation: "USD", Cur_OfficialRate: 32.456, Cur_Scale: 10 },
    ]);

    await refreshRates({ from: TODAY, to: TODAY });

    expect(repository.saveMany).toHaveBeenCalledWith([
      { date: utc("2026-08-19"), fromCurrency: "USD", rate: "3.24560000" },
    ]);
  });

  it("walks every day of the requested range", async () => {
    respondWith(published);

    const result = await refreshRates({
      from: new Date("2026-08-17T10:00:00.000Z"),
      to: TODAY,
    });

    expect(result.dates).toBe(3);
    expect(vi.mocked(fetch).mock.calls.map(([url]) => url)).toEqual([
      expect.stringContaining("ondate=2026-08-17"),
      expect.stringContaining("ondate=2026-08-18"),
      expect.stringContaining("ondate=2026-08-19"),
    ]);
  });

  it("fails loudly when the National Bank does not answer", async () => {
    respondWith([], false);

    await expect(refreshRates({ from: TODAY, to: TODAY })).rejects.toThrow(
      /503/,
    );
    expect(repository.saveMany).not.toHaveBeenCalled();
  });

  it("explains an unreachable National Bank instead of leaking the network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    await expect(refreshRates({ from: TODAY, to: TODAY })).rejects.toThrow(
      /unreachable/,
    );
    expect(repository.saveMany).not.toHaveBeenCalled();
  });

  it("rejects a response that does not match the published format", async () => {
    respondWith([{ Cur_Abbreviation: "USD" }]);

    await expect(refreshRates({ from: TODAY, to: TODAY })).rejects.toThrow();
    expect(repository.saveMany).not.toHaveBeenCalled();
  });
});
