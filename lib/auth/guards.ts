import { auth } from "@/lib/auth";
import { isDomainError, UnauthenticatedError } from "@/lib/errors";
import { assertAdmin, getActiveUser } from "@/lib/services/access";
import type { AuthenticatedUser } from "@/lib/services/auth";

export async function requireUser(): Promise<AuthenticatedUser> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthenticatedError();
  }

  return getActiveUser(session.user.id);
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();

  assertAdmin(user);

  return user;
}

export async function hasActiveUser(): Promise<boolean> {
  try {
    await requireUser();
    return true;
  } catch (error) {
    if (isDomainError(error)) {
      return false;
    }

    throw error;
  }
}
