import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";

import { isDomainError } from "@/lib/errors";
import type { Currency, Role } from "@/lib/generated/prisma/enums";
import { credentialsSchema } from "@/lib/schemas/auth";
import { authenticateUser } from "@/lib/services/auth";

const THIRTY_DAYS = 30 * 24 * 60 * 60;

type SessionClaims = JWT & {
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
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        try {
          return await authenticateUser(parsed.data);
        } catch (error) {
          if (isDomainError(error)) {
            return null;
          }

          throw error;
        }
      },
    }),
  ],
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
