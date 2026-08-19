import { describe, expect, it } from "vitest";

import { createWalletSchema, updateWalletSchema } from "@/lib/schemas/wallet";

const valid = {
  name: "Наличные",
  type: "CASH",
  currency: "BYN",
  initialBalance: 10_000,
};

describe("createWalletSchema", () => {
  it("accepts a complete wallet", () => {
    expect(createWalletSchema.safeParse(valid).success).toBe(true);
  });

  it("trims the name and rejects an empty one", () => {
    const parsed = createWalletSchema.safeParse({ ...valid, name: "  Карта " });

    expect(parsed.success && parsed.data.name).toBe("Карта");
    expect(createWalletSchema.safeParse({ ...valid, name: "   " }).success).toBe(
      false,
    );
  });

  it("rejects a name longer than sixty characters", () => {
    expect(
      createWalletSchema.safeParse({ ...valid, name: "н".repeat(61) }).success,
    ).toBe(false);
  });

  it("defaults the initial balance to zero", () => {
    const { currency, name, type } = valid;
    const parsed = createWalletSchema.safeParse({ currency, name, type });

    expect(parsed.success && parsed.data.initialBalance).toBe(0);
  });

  it("accepts a negative initial balance", () => {
    expect(
      createWalletSchema.safeParse({ ...valid, initialBalance: -5_000 }).success,
    ).toBe(true);
  });

  it("rejects a fractional initial balance", () => {
    expect(
      createWalletSchema.safeParse({ ...valid, initialBalance: 10.5 }).success,
    ).toBe(false);
  });

  it("rejects an amount the column cannot hold", () => {
    expect(
      createWalletSchema.safeParse({ ...valid, initialBalance: 2_147_483_648 })
        .success,
    ).toBe(false);
  });

  it("rejects an unknown wallet type and currency", () => {
    expect(createWalletSchema.safeParse({ ...valid, type: "CRYPTO" }).success).toBe(
      false,
    );
    expect(
      createWalletSchema.safeParse({ ...valid, currency: "PLN" }).success,
    ).toBe(false);
  });
});

describe("updateWalletSchema", () => {
  it("accepts a change of a single field", () => {
    expect(updateWalletSchema.safeParse({ name: "Карта" }).success).toBe(true);
  });

  it("drops the currency: it is fixed at creation", () => {
    const parsed = updateWalletSchema.safeParse({
      name: "Карта",
      currency: "USD",
    });

    expect(parsed.success && parsed.data).toEqual({ name: "Карта" });
  });
});
