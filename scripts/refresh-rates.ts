import "dotenv/config";

import { refreshRates } from "@/lib/services/exchange-rate";

function parseDate(value: string | undefined, fallback: Date): Date {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    throw new TypeError(`Expected a date as YYYY-MM-DD, got ${value}`);
  }

  return parsed;
}

async function main() {
  const [fromArgument, toArgument] = process.argv.slice(2);
  const today = new Date();
  const from = parseDate(fromArgument, today);
  const to = parseDate(toArgument, from);

  const { dates, rates } = await refreshRates({ from, to });

  console.log(`Fetched ${dates} day(s), stored ${rates} rate(s)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
