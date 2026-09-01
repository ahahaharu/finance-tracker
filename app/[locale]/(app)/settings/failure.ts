export const settingsFormErrorCodes = [
  "VALIDATION_FAILED",
  "INVALID_CREDENTIALS",
  "RATE_NOT_AVAILABLE",
  "NOT_FOUND",
] as const;

export type SettingsErrorCode = (typeof settingsFormErrorCodes)[number];

export type SettingsFormState = {
  code?: SettingsErrorCode;
  invalid?: string[];
  saved?: boolean;
};
