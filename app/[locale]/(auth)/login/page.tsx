import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { toLocale } from "@/i18n/routing";
import { hasActiveUser } from "@/lib/auth/guards";
import { decodeFailure } from "@/lib/forms/state";

import { authFormErrorCodes } from "../failure";
import { LoginForm } from "../login-form";

export default async function LoginPage({
  params,
  searchParams,
}: PageProps<"/[locale]/login">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  if (await hasActiveUser()) {
    return redirect({ href: "/", locale });
  }

  return (
    <LoginForm
      initialState={decodeFailure(await searchParams, authFormErrorCodes)}
    />
  );
}
