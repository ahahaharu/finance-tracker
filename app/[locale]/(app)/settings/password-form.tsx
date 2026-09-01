"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormFallback } from "@/components/form-fallback";
import { Input } from "@/components/ui/input";

import type { SettingsFormState } from "./failure";

function PasswordForm({
  action,
  initialState,
}: {
  action: (
    state: SettingsFormState,
    formData: FormData,
  ) => Promise<SettingsFormState>;
  initialState: SettingsFormState;
}) {
  const t = useTranslations("settings");
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="flex w-full max-w-[320px] flex-col gap-4"
      noValidate
    >
      <FormFallback scope="password" />
      <Input
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        label={t("fields.currentPassword")}
        error={
          state.code === "INVALID_CREDENTIALS"
            ? t("errors.INVALID_CREDENTIALS")
            : state.invalid?.includes("currentPassword")
              ? t("fieldErrors.currentPassword")
              : undefined
        }
      />

      <Input
        name="newPassword"
        type="password"
        autoComplete="new-password"
        label={t("fields.newPassword")}
        error={
          state.invalid?.includes("newPassword")
            ? t("fieldErrors.newPassword")
            : undefined
        }
      />

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {t("actions.changePassword")}
        </Button>
        {state.saved ? (
          <span className="text-12 text-ink-muted">{t("passwordChanged")}</span>
        ) : null}
      </div>
    </form>
  );
}

export { PasswordForm };
