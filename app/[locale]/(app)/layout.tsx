import { getTranslations, setRequestLocale } from "next-intl/server";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link, redirect } from "@/i18n/navigation";
import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { isDomainError } from "@/lib/errors";
import { Role } from "@/lib/generated/prisma/enums";
import type { AuthenticatedUser } from "@/lib/services/auth";

import { AppNav } from "./app-nav";
import { SignOutButton } from "./sign-out-button";

function initial(name: string): string {
  return [...name.trim()].slice(0, 1).join("").toUpperCase() || "?";
}

export default async function AppLayout({
  children,
  modal,
  params,
}: LayoutProps<"/[locale]">) {
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

  const t = await getTranslations("app");

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 flex h-dvh w-sidebar shrink-0 flex-col justify-between border-r border-line">
        <div className="flex flex-col gap-6 p-4">
          <Link
            href="/"
            className="flex h-control items-center px-2 text-14 font-medium text-ink"
          >
            {t("title")}
          </Link>
          <AppNav isAdmin={user.role === Role.ADMIN} />
        </div>

        <div className="flex items-center gap-2 border-t border-line p-3">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sunken text-12 text-ink-muted"
            aria-hidden
          >
            {initial(user.name)}
          </span>
          <span
            className="min-w-0 flex-1 truncate text-13 text-ink"
            title={`${user.name} · ${user.email}`}
          >
            {user.name}
          </span>
          <div className="flex shrink-0 items-center">
            <LocaleSwitcher />
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-page py-page">{children}</main>
      {modal}
    </div>
  );
}
