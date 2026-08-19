"use client";

import { LogOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

import { signOutAction } from "./actions";

function SignOutButton() {
  const t = useTranslations("auth");
  const locale = useLocale();

  return (
    <form action={signOutAction.bind(null, locale)}>
      <Tooltip content={t("signOut")}>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label={t("signOut")}
        >
          <LogOut aria-hidden />
        </Button>
      </Tooltip>
    </form>
  );
}

export { SignOutButton };
