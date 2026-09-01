import { beforeEach, describe, expect, it, vi } from "vitest";

import { formFailure } from "@/lib/forms/failure";
import { returnField, scopeField, scriptField } from "@/lib/forms/state";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("@/i18n/navigation", () => ({ redirect }));

function formData(entries: Record<string, string>): FormData {
  const data = new FormData();

  for (const [name, value] of Object.entries(entries)) {
    data.set(name, value);
  }

  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("formFailure", () => {
  it("returns the state to a form that runs with scripting", () => {
    const state = { code: "VALIDATION_FAILED", invalid: ["name"] };

    expect(
      formFailure(
        "ru",
        formData({ [scriptField]: "on", [returnField]: "/wallets/new" }),
        state,
      ),
    ).toEqual(state);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("puts the failure into the address of a form submitted without scripting", () => {
    formFailure(
      "ru",
      formData({ [scriptField]: "off", [returnField]: "/wallets/new" }),
      { code: "WALLET_NAME_TAKEN", invalid: ["name"] },
    );

    expect(redirect).toHaveBeenCalledWith({
      href: {
        pathname: "/wallets/new",
        query: { error: "WALLET_NAME_TAKEN", invalid: "name" },
      },
      locale: "ru",
    });
  });

  it("names the form when the page carries several of them", () => {
    formFailure(
      "en",
      formData({
        [scriptField]: "off",
        [returnField]: "/settings",
        [scopeField]: "password",
      }),
      { code: "INVALID_CREDENTIALS" },
    );

    expect(redirect).toHaveBeenCalledWith({
      href: {
        pathname: "/settings",
        query: { error: "INVALID_CREDENTIALS", form: "password" },
      },
      locale: "en",
    });
  });

  it("never redirects to an address outside the application", () => {
    const state = { code: "VALIDATION_FAILED" } as const;

    expect(
      formFailure(
        "ru",
        formData({
          [scriptField]: "off",
          [returnField]: "https://example.com/wallets",
        }),
        state,
      ),
    ).toEqual(state);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns the state when the form did not say where to go back", () => {
    const state = { code: "VALIDATION_FAILED" } as const;

    expect(formFailure("ru", formData({}), state)).toEqual(state);
    expect(redirect).not.toHaveBeenCalled();
  });
});
