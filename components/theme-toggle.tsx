"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

function ThemeToggle() {
  const t = useTranslations("theme");

  function toggle() {
    const next =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  }

  return (
    <Tooltip content={t("toggle")}>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label={t("toggle")}
      >
        <Moon size={16} className="dark:hidden" />
        <Sun size={16} className="hidden dark:block" />
      </Button>
    </Tooltip>
  );
}

export { ThemeToggle };
