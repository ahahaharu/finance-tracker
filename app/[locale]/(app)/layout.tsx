import { getTranslations, setRequestLocale } from "next-intl/server";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link, redirect } from "@/i18n/navigation";
import { toLocale } from "@/i18n/routing";
import { hasActiveUser } from "@/lib/auth/guards";

import { SignOutButton } from "./sign-out-button";

const navigation = [
  { href: "/", key: "overview" },
  { href: "/wallets", key: "wallets" },
  { href: "/categories", key: "categories" },
] as const;

export default async function AppLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  if (!(await hasActiveUser())) {
    redirect({ href: "/login", locale });
  }

  const t = await getTranslations("navigation");

  return (
    <div className="flex min-h-full">
      <aside className="flex w-sidebar shrink-0 flex-col justify-between border-r border-line p-page">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="flex h-control items-center rounded-[var(--radius)] px-3 text-13 text-ink hover:bg-sunken"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
          <SignOutButton />
        </div>
      </aside>
      <main className="w-full max-w-content px-page py-page">{children}</main>
    </div>
  );
}
