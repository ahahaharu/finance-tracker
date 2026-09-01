import "dotenv/config";

import { hash } from "bcryptjs";

import { demoRepository } from "@/lib/repositories/demo";
import { BCRYPT_COST } from "@/lib/services/auth";
import {
  ADMIN_EMAIL,
  DEMO_PASSWORD,
  USER_EMAIL,
  buildDemoData,
  demoRange,
} from "@/lib/services/demo";

async function main() {
  const now = new Date();
  const { from, to } = demoRange(now);

  const data = buildDemoData({
    now,
    passwordHash: await hash(DEMO_PASSWORD, BCRYPT_COST),
    knownRates: await demoRepository.listRates(from, to),
  });

  const counts = await demoRepository.replace(data);

  console.log(
    [
      `Users: ${counts.users}`,
      `categories: ${counts.categories}`,
      `wallets: ${counts.wallets}`,
      `transactions: ${counts.transactions}`,
      `budgets: ${counts.budgets}`,
      `rates added: ${counts.rates}`,
    ].join(", "),
  );
  console.log(
    `Sign in as ${USER_EMAIL} or ${ADMIN_EMAIL} with password ${DEMO_PASSWORD}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
