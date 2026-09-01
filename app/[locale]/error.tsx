"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function LocaleError({ reset }: { reset: () => void }) {
  const t = useTranslations("error");

  return (
    <main className="flex flex-1 items-start justify-center px-page pb-section">
      <div className="flex w-full max-w-[320px] flex-col items-start gap-4 pt-section">
        <p className="text-13 text-ink-muted">{t("unexpected")}</p>
        <Button variant="secondary" onClick={reset}>
          {t("retry")}
        </Button>
      </div>
    </main>
  );
}
