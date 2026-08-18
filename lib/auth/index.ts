import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/lib/auth/config";
import { AccountBlockedError, isDomainError } from "@/lib/errors";
import { credentialsSchema } from "@/lib/schemas/auth";
import { authenticateUser } from "@/lib/services/auth";

class AccountBlockedSignin extends CredentialsSignin {
  code = "ACCOUNT_BLOCKED";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
          if (error instanceof AccountBlockedError) {
            throw new AccountBlockedSignin();
          }

          if (isDomainError(error)) {
            return null;
          }

          throw error;
        }
      },
    }),
  ],
});
