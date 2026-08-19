import { getTranslations, setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const user = await requireUser();
  const t = await getTranslations("auth");

  return (
    <div className="flex flex-col gap-section">
      <h1 className="text-20 font-medium">{t("session.title")}</h1>
      <dl className="flex flex-col gap-2">
        <div className="flex gap-3">
          <dt className="w-40 text-12 text-ink-muted">{t("fields.name")}</dt>
          <dd className="text-13">{user.name}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-40 text-12 text-ink-muted">{t("fields.email")}</dt>
          <dd className="text-13">{user.email}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-40 text-12 text-ink-muted">
            {t("fields.baseCurrency")}
          </dt>
          <dd className="text-13">{user.baseCurrency}</dd>
        </div>
      </dl>
      <p className="text-12 text-ink-muted">{t("session.hint")}</p>
    </div>
  );
}
