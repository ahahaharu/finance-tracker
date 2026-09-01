import { describe, expect, it } from "vitest";

import { RateLimitedError } from "@/lib/errors";
import {
  attemptKey,
  attemptLimit,
  attemptWindowMs,
  clientAddress,
  consumeAttempt,
} from "@/lib/services/rate-limit";

const start = Date.UTC(2026, 8, 1, 12, 0, 0);

function spend(key: string, count: number, now: number): void {
  for (let index = 0; index < count; index += 1) {
    consumeAttempt(key, now + index);
  }
}

describe("consumeAttempt", () => {
  it("allows the documented number of attempts within the window", () => {
    expect(() => spend("case:allow", attemptLimit, start)).not.toThrow();
  });

  it("rejects the attempt after the limit is reached", () => {
    spend("case:reject", attemptLimit, start);

    expect(() => consumeAttempt("case:reject", start + 1000)).toThrow(
      RateLimitedError,
    );
  });

  it("reports how long the caller has to wait", () => {
    spend("case:retry", attemptLimit, start);

    try {
      consumeAttempt("case:retry", start + 60_000);
      expect.unreachable("consumeAttempt should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitedError);
      expect((error as RateLimitedError).code).toBe("RATE_LIMITED");
      expect((error as RateLimitedError).details).toEqual({
        retryAfterSeconds: (attemptWindowMs - 60_000) / 1000,
      });
    }
  });

  it("lets the address try again once the window has passed", () => {
    spend("case:window", attemptLimit, start);

    expect(() =>
      consumeAttempt("case:window", start + attemptWindowMs + 1),
    ).not.toThrow();
  });

  it("frees one slot at a time as the window slides", () => {
    consumeAttempt("case:slide", start);
    spend("case:slide", attemptLimit - 1, start + 60_000);

    const afterFirstExpired = start + attemptWindowMs + 1;

    expect(() => consumeAttempt("case:slide", afterFirstExpired)).not.toThrow();
    expect(() => consumeAttempt("case:slide", afterFirstExpired)).toThrow(
      RateLimitedError,
    );
  });

  it("counts every address separately", () => {
    spend("case:one", attemptLimit, start);

    expect(() => consumeAttempt("case:two", start)).not.toThrow();
  });

  it("counts sign-in and registration separately", () => {
    spend(attemptKey("login", "10.0.0.1"), attemptLimit, start);

    expect(() =>
      consumeAttempt(attemptKey("register", "10.0.0.1"), start),
    ).not.toThrow();
  });
});

describe("clientAddress", () => {
  it("takes the first address of the forwarding chain", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.7, 70.41.3.18",
    });

    expect(clientAddress(headers)).toBe("203.0.113.7");
  });

  it("falls back to the real address header", () => {
    expect(clientAddress(new Headers({ "x-real-ip": "203.0.113.9" }))).toBe(
      "203.0.113.9",
    );
  });

  it("groups requests without an address under a single key", () => {
    expect(clientAddress(new Headers())).toBe("unknown");
  });
});
