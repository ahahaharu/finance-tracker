import type { DefaultSession } from "next-auth";

import type { Currency, Role } from "@/lib/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role: Role;
    baseCurrency: Currency;
    locale: string;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      baseCurrency: Currency;
      locale: string;
    } & DefaultSession["user"];
  }
}
