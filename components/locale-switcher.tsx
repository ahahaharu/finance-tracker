"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

function LocaleSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const nextLocale =
    routing.locales[
      (routing.locales.indexOf(locale) + 1) % routing.locales.length
    ];

  function switchLocale() {
    router.replace(
      { pathname, query: Object.fromEntries(searchParams) },
      { locale: nextLocale },
    );
  }

  return (
    <Button variant="ghost" onClick={switchLocale} aria-label={t("switch")}>
      {t(nextLocale)}
    </Button>
  );
}

export { LocaleSwitcher };
