"use client";

import {
  LayoutDashboard,
  type LucideIcon,
  Receipt,
  Settings,
  Shield,
  Tags,
  Target,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type NavigationKey =
  | "overview"
  | "wallets"
  | "transactions"
  | "categories"
  | "budgets"
  | "settings"
  | "admin";

type NavigationItem = {
  href: string;
  key: NavigationKey;
  icon: LucideIcon;
};

const navigation: readonly NavigationItem[] = [
  { href: "/", key: "overview", icon: LayoutDashboard },
  { href: "/wallets", key: "wallets", icon: Wallet },
  { href: "/transactions", key: "transactions", icon: Receipt },
  { href: "/categories", key: "categories", icon: Tags },
  { href: "/budgets", key: "budgets", icon: Target },
  { href: "/settings", key: "settings", icon: Settings },
];

const administration: NavigationItem = {
  href: "/admin",
  key: "admin",
  icon: Shield,
};

function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const items = isAdmin ? [...navigation, administration] : navigation;

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map(({ href, key, icon: Icon }) => {
        const current =
          href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={key}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex h-control items-center gap-2 rounded-[var(--radius)] px-2 text-13",
              current
                ? "bg-sunken text-ink"
                : "text-ink-muted hover:bg-sunken hover:text-ink",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}

export { AppNav };
