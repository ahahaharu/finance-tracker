"use server";

import type { Locale } from "next-intl";

import { redirect } from "@/i18n/navigation";
import { signOut } from "@/lib/auth";

export async function signOutAction(locale: Locale) {
  await signOut({ redirect: false });

  return redirect({ href: "/login", locale });
}
