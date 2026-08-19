"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
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

  const description = t("switchTo", {
    language: t(`languageNames.${nextLocale}`),
  });

  function switchLocale() {
    router.replace(
      { pathname, query: Object.fromEntries(searchParams) },
      { locale: nextLocale },
    );
  }

  return (
    <Tooltip content={description}>
      <Button
        variant="ghost"
        size="icon"
        onClick={switchLocale}
        aria-label={description}
      >
        {t(locale)}
      </Button>
    </Tooltip>
  );
}

export { LocaleSwitcher };
