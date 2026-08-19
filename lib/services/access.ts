import {
  AccountBlockedError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
} from "@/lib/errors";
import { Role } from "@/lib/generated/prisma/enums";
import { userRepository } from "@/lib/repositories/user";
import { type AuthenticatedUser, toAuthenticatedUser } from "@/lib/services/auth";

export async function getActiveUser(
  userId: string,
): Promise<AuthenticatedUser> {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new UnauthenticatedError();
  }

  if (user.isBlocked) {
    throw new AccountBlockedError();
  }

  return toAuthenticatedUser(user);
}

export function assertOwnership<T extends { userId: string }>(
  resource: T | null | undefined,
  userId: string,
): asserts resource is T {
  if (!resource || resource.userId !== userId) {
    throw new NotFoundError();
  }
}

export function assertAdmin(user: AuthenticatedUser): void {
  if (user.role !== Role.ADMIN) {
    throw new ForbiddenError();
  }
}
