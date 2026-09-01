import { RateLimitedError } from "@/lib/errors";

export const attemptLimit = 10;
export const attemptWindowMs = 15 * 60 * 1000;

const attempts = new Map<string, number[]>();

function fresh(hits: number[], now: number): number[] {
  return hits.filter((hit) => hit > now - attemptWindowMs);
}

function prune(now: number): void {
  for (const [key, hits] of attempts) {
    const kept = fresh(hits, now);

    if (kept.length === 0) {
      attempts.delete(key);
    } else {
      attempts.set(key, kept);
    }
  }
}

export function consumeAttempt(key: string, now: number = Date.now()): void {
  prune(now);

  const hits = attempts.get(key) ?? [];

  if (hits.length >= attemptLimit) {
    const retryAfter = Math.ceil((hits[0] + attemptWindowMs - now) / 1000);

    throw new RateLimitedError(Math.max(retryAfter, 1));
  }

  attempts.set(key, [...hits, now]);
}

export function clientAddress(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (forwarded) {
    return forwarded;
  }

  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function attemptKey(
  scope: "login" | "register",
  address: string,
): string {
  return `${scope}:${address}`;
}
