import { describe, expect, it } from "vitest";

import {
  decodeFailure,
  encodeFailure,
  isScripted,
  safeReturnPath,
  scriptField,
} from "@/lib/forms/state";

const codes = ["VALIDATION_FAILED", "EMAIL_TAKEN"] as const;

function formData(entries: Record<string, string>): FormData {
  const data = new FormData();

  for (const [name, value] of Object.entries(entries)) {
    data.set(name, value);
  }

  return data;
}

describe("isScripted", () => {
  it("recognises a submission made by the hydrated form", () => {
    expect(isScripted(formData({ [scriptField]: "on" }))).toBe(true);
  });

  it("treats a submission without the marker as unscripted", () => {
    expect(isScripted(formData({}))).toBe(false);
    expect(isScripted(formData({ [scriptField]: "off" }))).toBe(false);
  });
});

describe("safeReturnPath", () => {
  it("accepts a path inside the application", () => {
    expect(safeReturnPath("/wallets/new")).toBe("/wallets/new");
  });

  it("rejects an absolute address", () => {
    expect(safeReturnPath("https://example.com/wallets")).toBeNull();
  });

  it("rejects a protocol-relative address", () => {
    expect(safeReturnPath("//example.com/wallets")).toBeNull();
  });

  it("rejects a path carrying its own query or fragment", () => {
    expect(safeReturnPath("/wallets?error=NOT_FOUND")).toBeNull();
    expect(safeReturnPath("/wallets#anchor")).toBeNull();
  });

  it("rejects a missing value", () => {
    expect(safeReturnPath(null)).toBeNull();
  });
});

describe("encodeFailure", () => {
  it("carries the code and the invalid fields", () => {
    expect(
      encodeFailure({ code: "VALIDATION_FAILED", invalid: ["email", "name"] }),
    ).toEqual({ error: "VALIDATION_FAILED", invalid: "email,name" });
  });

  it("omits the field list when the failure is not about fields", () => {
    expect(encodeFailure({ code: "EMAIL_TAKEN" })).toEqual({
      error: "EMAIL_TAKEN",
    });
  });

  it("writes nothing for a successful submission", () => {
    expect(encodeFailure({})).toEqual({});
  });

  it("names the form when a page carries several of them", () => {
    expect(encodeFailure({ code: "EMAIL_TAKEN" }, "profile")).toEqual({
      error: "EMAIL_TAKEN",
      form: "profile",
    });
  });
});

describe("decodeFailure", () => {
  it("restores a failure written by the same encoder", () => {
    const query = encodeFailure({
      code: "VALIDATION_FAILED",
      invalid: ["email"],
    });

    expect(decodeFailure(query, codes)).toEqual({
      code: "VALIDATION_FAILED",
      invalid: ["email"],
    });
  });

  it("ignores a code the page does not know", () => {
    expect(decodeFailure({ error: "SOMETHING_ELSE" }, codes)).toEqual({});
  });

  it("ignores a repeated parameter beyond the first value", () => {
    expect(
      decodeFailure({ error: ["EMAIL_TAKEN", "VALIDATION_FAILED"] }, codes),
    ).toEqual({ code: "EMAIL_TAKEN" });
  });

  it("returns an empty state for a clean address", () => {
    expect(decodeFailure({}, codes)).toEqual({});
  });

  it("gives the failure only to the form that produced it", () => {
    const query = encodeFailure({ code: "EMAIL_TAKEN" }, "profile");

    expect(decodeFailure(query, codes, "profile")).toEqual({
      code: "EMAIL_TAKEN",
    });
    expect(decodeFailure(query, codes, "password")).toEqual({});
    expect(decodeFailure(query, codes)).toEqual({});
  });
});
