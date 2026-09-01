import { getTranslations, setRequestLocale } from "next-intl/server";

import { SectionTitle } from "@/components/ui/section-title";
import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { decodeFailure } from "@/lib/forms/state";
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

export default async function SettingsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/settings">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const user = await requireUser();
  const query = await searchParams;
  const [profile, t] = await Promise.all([
    getProfile(user.id),
    getTranslations("settings"),
  ]);

  return (
    <div className="flex flex-col gap-section">
      <div className="flex flex-col gap-1">
        <h1 className="text-20 font-medium">{t("title")}</h1>
        <p className="text-13 text-ink-muted">{profile.email}</p>
      </div>

      <section className="flex flex-col gap-3">
        <SectionTitle>{t("sections.profile")}</SectionTitle>
        <ProfileForm
          action={updateProfileAction.bind(null, locale)}
          name={profile.name}
          locale={profile.locale}
          initialState={decodeFailure(query, settingsFormErrorCodes, "profile")}
        />
      </section>

      <section className="flex flex-col gap-3 border-t border-line pt-6">
        <SectionTitle>{t("sections.baseCurrency")}</SectionTitle>
        <CurrencyForm
          action={changeCurrencyAction.bind(null, locale)}
          baseCurrency={profile.baseCurrency}
          initialState={decodeFailure(query, settingsFormErrorCodes, "currency")}
        />
      </section>

      <section className="flex flex-col gap-3 border-t border-line pt-6">
        <SectionTitle>{t("sections.password")}</SectionTitle>
        <PasswordForm
          action={changePasswordAction.bind(null, locale)}
          initialState={decodeFailure(query, settingsFormErrorCodes, "password")}
        />
      </section>
    </div>
  );
}
