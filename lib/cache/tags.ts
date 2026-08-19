import { revalidateTag } from "next/cache";

export const RATES_TAG = "exchange-rates";

export function invalidate(tags: readonly string[]): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag, "max");
    } catch {
      continue;
    }
  }
}
