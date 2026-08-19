"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function WalletsError({ reset }: { reset: () => void }) {
  const t = useTranslations("wallets");

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-13 text-ink-muted">{t("errors.unexpected")}</p>
      <Button variant="secondary" onClick={reset}>
        {t("actions.retry")}
      </Button>
    </div>
  );
}
