export const scriptField = "script";
export const returnField = "returnTo";
export const scopeField = "formScope";

export type SearchParams = Record<string, string | string[] | undefined>;

export type FormFailure<Code extends string> = {
  code?: Code;
  invalid?: string[];
};

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function isScripted(formData: FormData): boolean {
  return formData.get(scriptField) === "on";
}

export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return null;
  }

  if (value.startsWith("//") || /[\\?#\s]/.test(value)) {
    return null;
  }

  return value;
}

export function readScope(formData: FormData): string {
  return String(formData.get(scopeField) ?? "");
}

export function encodeFailure<Code extends string>(
  failure: FormFailure<Code>,
  scope = "",
): Record<string, string> {
  if (!failure.code) {
    return {};
  }

  return {
    error: failure.code,
    ...(scope ? { form: scope } : {}),
    ...(failure.invalid?.length ? { invalid: failure.invalid.join(",") } : {}),
  };
}

export function decodeFailure<Code extends string>(
  query: SearchParams,
  codes: readonly Code[],
  scope = "",
): FormFailure<Code> {
  const code = codes.find((known) => known === single(query.error));

  if (!code || (single(query.form) ?? "") !== scope) {
    return {};
  }

  const invalid = single(query.invalid)?.split(",").filter(Boolean);

  return { code, ...(invalid?.length ? { invalid } : {}) };
}
