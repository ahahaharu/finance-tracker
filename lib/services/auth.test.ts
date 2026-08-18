import { compare, hash } from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AccountBlockedError,
  EmailTakenError,
  InvalidCredentialsError,
} from "@/lib/errors";
import type { User } from "@/lib/generated/prisma/client";
import type { NewUser } from "@/lib/repositories/user";
import { authenticateUser, registerUser } from "@/lib/services/auth";

const repository = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/repositories/user", () => ({ userRepository: repository }));

const registerInput = {
  email: "anna@example.com",
  password: "correct8horse",
  name: "Анна",
  baseCurrency: "BYN",
} as const;

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

function createdUser(): NewUser {
  return repository.create.mock.calls[0][0] as NewUser;
}

beforeEach(() => {
  vi.clearAllMocks();
  repository.findByEmail.mockResolvedValue(null);
  repository.create.mockImplementation((data: NewUser) =>
    Promise.resolve(userFixture({ email: data.email, name: data.name })),
  );
});

describe("registerUser", () => {
  it("rejects an email that is already registered", async () => {
    repository.findByEmail.mockResolvedValue(userFixture());

    await expect(registerUser(registerInput, "ru")).rejects.toThrow(
      EmailTakenError,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("stores the password only as a bcrypt hash", async () => {
    await registerUser(registerInput, "ru");

    const { passwordHash } = createdUser();

    expect(passwordHash).not.toBe(registerInput.password);
    expect(passwordHash).toMatch(/^\$2[aby]\$1[0-9]\$/);
    await expect(compare(registerInput.password, passwordHash)).resolves.toBe(
      true,
    );
  });

  it("creates the default category set", async () => {
    await registerUser(registerInput, "ru");

    const { categories } = createdUser();
    const expense = categories.filter(({ kind }) => kind === "EXPENSE");
    const income = categories.filter(({ kind }) => kind === "INCOME");

    expect(expense.length).toBeGreaterThanOrEqual(8);
    expect(income.length).toBeGreaterThanOrEqual(3);
    expect(expense.map(({ name }) => name)).toContain("Продукты");
    expect(income.map(({ name }) => name)).toContain("Зарплата");
  });

  it("creates the default categories in the registration locale", async () => {
    await registerUser(registerInput, "en");

    const { categories, locale } = createdUser();

    expect(locale).toBe("en");
    expect(categories.map(({ name }) => name)).toContain("Groceries");
  });

  it("returns the user without the password hash", async () => {
    const user = await registerUser(registerInput, "ru");

    expect(user).toEqual({
      id: "usr_1",
      email: "anna@example.com",
      name: "Анна",
      role: "USER",
      baseCurrency: "BYN",
      locale: "ru",
    });
  });
});

describe("authenticateUser", () => {
  const password = "correct8horse";

  it("returns the user when the password matches", async () => {
    repository.findByEmail.mockResolvedValue(
      userFixture({ passwordHash: await hash(password, 10) }),
    );

    const user = await authenticateUser({
      email: "anna@example.com",
      password,
    });

    expect(user.id).toBe("usr_1");
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("rejects a wrong password", async () => {
    repository.findByEmail.mockResolvedValue(
      userFixture({ passwordHash: await hash(password, 10) }),
    );

    await expect(
      authenticateUser({ email: "anna@example.com", password: "wrong8pass" }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("rejects an unknown email with the same error as a wrong password", async () => {
    await expect(
      authenticateUser({ email: "nobody@example.com", password }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("rejects a blocked account even when the password is correct", async () => {
    repository.findByEmail.mockResolvedValue(
      userFixture({ passwordHash: await hash(password, 10), isBlocked: true }),
    );

    await expect(
      authenticateUser({ email: "anna@example.com", password }),
    ).rejects.toThrow(AccountBlockedError);
  });

  it("does not reveal the block before the password is verified", async () => {
    repository.findByEmail.mockResolvedValue(
      userFixture({ passwordHash: await hash(password, 10), isBlocked: true }),
    );

    await expect(
      authenticateUser({ email: "anna@example.com", password: "wrong8pass" }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
