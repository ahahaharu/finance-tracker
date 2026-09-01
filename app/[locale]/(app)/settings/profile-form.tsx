"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormFallback } from "@/components/form-fallback";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { routing } from "@/i18n/routing";

import type { SettingsFormState } from "./failure";

function ProfileForm({
  action,
  name,
  locale,
  initialState,
}: {
  action: (
    state: SettingsFormState,
    formData: FormData,
  ) => Promise<SettingsFormState>;
  initialState: SettingsFormState;
  name: string;
  locale: string;
}) {
  const t = useTranslations("settings");
  const [language, setLanguage] = useState(locale);
  const [state, formAction, pending] = useActionState(action, initialState);

  const options = routing.locales.map((value) => ({
    value,
    label: t(`languages.${value}`),
  }));

  return (
    <form
      action={formAction}
      className="flex w-full max-w-[320px] flex-col gap-4"
      noValidate
    >
      <FormFallback scope="profile" />
      <Input
        name="name"
        defaultValue={name}
        label={t("fields.name")}
        error={state.invalid?.includes("name") ? t("fieldErrors.name") : undefined}
      />

      <Select
        name="locale"
        value={language}
        onValueChange={(value) => setLanguage(value ?? locale)}
        options={options}
        label={t("fields.language")}
      />

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {t("actions.save")}
        </Button>
        {state.saved ? (
          <span className="text-12 text-ink-muted">{t("saved")}</span>
        ) : null}
      </div>
    </form>
  );
}

export { ProfileForm };
