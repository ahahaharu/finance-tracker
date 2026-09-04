import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/components/ui/section-title";
import { requireUser } from "@/lib/auth/guards";
import { decodeFailure, type SearchParams } from "@/lib/forms/state";
import { getProfile } from "@/lib/services/profile";

import {
  changeCurrencyAction,
  changePasswordAction,
  updateProfileAction,
} from "./actions";
import { CurrencyForm } from "./currency-form";
import { settingsFormErrorCodes } from "./failure";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";

const sectionClassName = "flex flex-col gap-3 border-t border-line pt-6";

function SettingsFallback() {
  return (
    <div className="flex flex-col gap-section">
      <span className="h-3 w-48 rounded-[var(--radius)] bg-sunken" />
      {[0, 1, 2].map((section) => (
        <div key={section} className="flex flex-col gap-3">
          <span className="h-3 w-32 rounded-[var(--radius)] bg-sunken" />
          <span className="h-control w-[320px] max-w-full rounded-[var(--radius)] bg-sunken" />
          <span className="h-control w-[320px] max-w-full rounded-[var(--radius)] bg-sunken" />
        </div>
      ))}
    </div>
  );
}

async function SettingsSections({
  locale,
  query,
}: {
  locale: Locale;
  query: SearchParams;
}) {
  const user = await requireUser();
  const [profile, t] = await Promise.all([
    getProfile(user.id),
    getTranslations("settings"),
  ]);

  return (
    <div className="flex flex-col gap-section">
      <p className="text-13 text-ink-muted">{profile.email}</p>

      <section className="flex flex-col gap-3">
        <SectionTitle>{t("sections.profile")}</SectionTitle>
        <ProfileForm
          action={updateProfileAction.bind(null, locale)}
          name={profile.name}
          locale={profile.locale}
          initialState={decodeFailure(query, settingsFormErrorCodes, "profile")}
        />
      </section>

      <section className={sectionClassName}>
        <SectionTitle>{t("sections.baseCurrency")}</SectionTitle>
        <CurrencyForm
          action={changeCurrencyAction.bind(null, locale)}
          baseCurrency={profile.baseCurrency}
          initialState={decodeFailure(query, settingsFormErrorCodes, "currency")}
        />
      </section>

      <section className={sectionClassName}>
        <SectionTitle>{t("sections.password")}</SectionTitle>
        <PasswordForm
          action={changePasswordAction.bind(null, locale)}
          initialState={decodeFailure(query, settingsFormErrorCodes, "password")}
        />
      </section>
    </div>
  );
}

export { SettingsFallback, SettingsSections };
