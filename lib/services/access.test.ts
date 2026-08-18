import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AccountBlockedError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
} from "@/lib/errors";
import type { User } from "@/lib/generated/prisma/client";
import {
  assertAdmin,
  assertOwnership,
  getActiveUser,
} from "@/lib/services/access";
import type { AuthenticatedUser } from "@/lib/services/auth";

const repository = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/repositories/user", () => ({ userRepository: repository }));

function userFixture(overrides: Partial<User> = {}): User {
  return {
    id: "usr_1",
    email: "anna@example.com",
    passwordHash: "hash",
    name: "Анна",
    role: "USER",
    baseCurrency: "BYN",
    locale: "ru",
    isBlocked: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function authenticated(role: AuthenticatedUser["role"]): AuthenticatedUser {
  return {
    id: "usr_1",
    email: "anna@example.com",
    name: "Анна",
    role,
    baseCurrency: "BYN",
    locale: "ru",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getActiveUser", () => {
  it("returns the user without the password hash", async () => {
    repository.findById.mockResolvedValue(userFixture());

    await expect(getActiveUser("usr_1")).resolves.toEqual(
      authenticated("USER"),
    );
  });

  it("rejects a blocked account on every request, not only at sign-in", async () => {
    repository.findById.mockResolvedValue(userFixture({ isBlocked: true }));

    await expect(getActiveUser("usr_1")).rejects.toThrow(AccountBlockedError);
  });

  it("rejects a session pointing at a deleted user", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(getActiveUser("usr_gone")).rejects.toThrow(
      UnauthenticatedError,
    );
  });

  it("reads the block flag from storage rather than from the session", async () => {
    repository.findById.mockResolvedValue(userFixture({ isBlocked: true }));

    await expect(getActiveUser("usr_1")).rejects.toThrow(AccountBlockedError);
    expect(repository.findById).toHaveBeenCalledWith("usr_1");
  });
});

describe("assertOwnership", () => {
  it("passes for a resource owned by the user", () => {
    expect(() => assertOwnership({ userId: "usr_1" }, "usr_1")).not.toThrow();
  });

  it("reports another user's resource as missing, never as forbidden", () => {
    try {
      assertOwnership({ userId: "usr_2" }, "usr_1");
      expect.unreachable("assertOwnership should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundError);
      expect((error as NotFoundError).code).toBe("NOT_FOUND");
    }
  });

  it("rejects a missing resource", () => {
    expect(() => assertOwnership(null, "usr_1")).toThrow(NotFoundError);
  });
});

describe("assertAdmin", () => {
  it("passes for an administrator", () => {
    expect(() => assertAdmin(authenticated("ADMIN"))).not.toThrow();
  });

  it("rejects the USER role", () => {
    expect(() => assertAdmin(authenticated("USER"))).toThrow(ForbiddenError);
  });
});
