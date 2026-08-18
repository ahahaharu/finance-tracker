import type { Locale } from "next-intl";
import { compare, hash } from "bcryptjs";

import { EmailTakenError, InvalidCredentialsError } from "@/lib/errors";
import type { Currency, Role } from "@/lib/generated/prisma/enums";
import type { User } from "@/lib/generated/prisma/client";
import { userRepository } from "@/lib/repositories/user";
import type { CredentialsInput, RegisterInput } from "@/lib/schemas/auth";
import { buildDefaultCategories } from "@/lib/services/default-categories";

const BCRYPT_COST = 10;

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  baseCurrency: Currency;
  locale: string;
};

function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    baseCurrency: user.baseCurrency,
    locale: user.locale,
  };
}

export async function registerUser(
  input: RegisterInput,
  locale: Locale,
): Promise<AuthenticatedUser> {
  const existing = await userRepository.findByEmail(input.email);

  if (existing) {
    throw new EmailTakenError();
  }

  const created = await userRepository.create({
    email: input.email,
    passwordHash: await hash(input.password, BCRYPT_COST),
    name: input.name,
    baseCurrency: input.baseCurrency,
    locale,
    categories: buildDefaultCategories(locale),
  });

  return toAuthenticatedUser(created);
}

export async function authenticateUser(
  input: CredentialsInput,
): Promise<AuthenticatedUser> {
  const user = await userRepository.findByEmail(input.email);

  if (!user) {
    throw new InvalidCredentialsError();
  }

  const matches = await compare(input.password, user.passwordHash);

  if (!matches) {
    throw new InvalidCredentialsError();
  }

  return toAuthenticatedUser(user);
}
