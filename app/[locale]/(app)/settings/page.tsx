import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";

import { SettingsFallback, SettingsSections } from "./settings-sections";

export default async function SettingsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/settings">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const query = await searchParams;
  const t = await getTranslations("settings");

  return (
    <div className="flex flex-col gap-section">
      <h1 className="text-20 font-medium">{t("title")}</h1>

      <Suspense fallback={<SettingsFallback />}>
        <SettingsSections locale={locale} query={query} />
      </Suspense>
    </div>
  );
}
