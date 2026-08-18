import { describe, expect, it } from "vitest";

import { credentialsSchema, registerSchema } from "@/lib/schemas/auth";

const valid = {
  email: "anna@example.com",
  password: "correct8horse",
  name: "Анна",
  baseCurrency: "BYN",
};

describe("registerSchema", () => {
  it("accepts a password with a letter and a digit", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a password shorter than eight characters", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "abc123" }).success,
    ).toBe(false);
  });

  it("rejects a password without a digit", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "correcthorse" }).success,
    ).toBe(false);
  });

  it("rejects a password without a letter", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "12345678" }).success,
    ).toBe(false);
  });

  it("accepts a Cyrillic password", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "пароль123" }).success,
    ).toBe(true);
  });

  it("normalises the email", () => {
    const parsed = registerSchema.parse({
      ...valid,
      email: "  Anna@Example.COM ",
    });

    expect(parsed.email).toBe("anna@example.com");
  });

  it("rejects a malformed email", () => {
    expect(registerSchema.safeParse({ ...valid, email: "anna@" }).success).toBe(
      false,
    );
  });

  it("rejects an empty name", () => {
    expect(registerSchema.safeParse({ ...valid, name: "   " }).success).toBe(
      false,
    );
  });

  it("rejects an unsupported base currency", () => {
    expect(
      registerSchema.safeParse({ ...valid, baseCurrency: "GBP" }).success,
    ).toBe(false);
  });
});

describe("credentialsSchema", () => {
  it("normalises the email and keeps the password as typed", () => {
    const parsed = credentialsSchema.parse({
      email: "Anna@Example.com",
      password: " secret ",
    });

    expect(parsed).toEqual({
      email: "anna@example.com",
      password: " secret ",
    });
  });

  it("rejects an empty password", () => {
    expect(
      credentialsSchema.safeParse({ email: valid.email, password: "" }).success,
    ).toBe(false);
  });
});
