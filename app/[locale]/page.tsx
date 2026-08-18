import { getTranslations, setRequestLocale } from "next-intl/server";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { redirect } from "@/i18n/navigation";
import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { isDomainError } from "@/lib/errors";
import type { AuthenticatedUser } from "@/lib/services/auth";

import { SignOutButton } from "./sign-out-button";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  let user: AuthenticatedUser;

  try {
    user = await requireUser();
  } catch (error) {
    if (isDomainError(error)) {
      return redirect({ href: "/login", locale });
    }

    throw error;
  }

  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-end gap-1 p-page">
        <LocaleSwitcher />
        <ThemeToggle />
        <SignOutButton />
      </header>
      <main className="mx-auto w-full max-w-content px-page pb-section">
        <h1 className="text-20 font-medium">{t("session.title")}</h1>
        <dl className="mt-4 flex flex-col gap-2">
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
        <p className="mt-6 text-12 text-ink-muted">{t("session.hint")}</p>
      </main>
    </div>
  );
}
