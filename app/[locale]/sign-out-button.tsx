"use client";

import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { signOutAction } from "./actions";

function SignOutButton() {
  const t = useTranslations("auth");
  const locale = useLocale();

  return (
    <form action={signOutAction.bind(null, locale)}>
      <Button type="submit" variant="secondary">
        {t("signOut")}
      </Button>
    </form>
  );
}

export { SignOutButton };
