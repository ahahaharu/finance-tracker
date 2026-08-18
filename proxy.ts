import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import createMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";

import { routing } from "@/i18n/routing";
import { authConfig } from "@/lib/auth/config";

const handleLocale = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

const publicRoutes = ["/login", "/register", "/ui"];

function splitLocale(pathname: string) {
  const [, first, ...rest] = pathname.split("/");

  return hasLocale(routing.locales, first)
    ? { locale: first, path: `/${rest.join("/")}` }
    : { locale: routing.defaultLocale, path: pathname };
}

function matches(path: string, routes: string[]) {
  return routes.some((route) => path === route || path.startsWith(`${route}/`));
}

export default auth((request) => {
  const { locale, path } = splitLocale(request.nextUrl.pathname);

  if (!request.auth?.user && !matches(path, publicRoutes)) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.nextUrl));
  }

  return handleLocale(request);
});

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
