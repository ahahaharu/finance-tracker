import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

import type { Currency, Role } from "@/lib/generated/prisma/enums";

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export type SessionClaims = JWT & {
  id: string;
  role: Role;
  baseCurrency: Currency;
  locale: string;
};

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: THIRTY_DAYS,
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (!user?.id) {
        return token;
      }

      return {
        ...token,
        id: user.id,
        role: user.role,
        baseCurrency: user.baseCurrency,
        locale: user.locale,
      } satisfies SessionClaims;
    },
    session({ session, token }) {
      const claims = token as SessionClaims;

      session.user.id = claims.id;
      session.user.role = claims.role;
      session.user.baseCurrency = claims.baseCurrency;
      session.user.locale = claims.locale;

      return session;
    },
  },
};
