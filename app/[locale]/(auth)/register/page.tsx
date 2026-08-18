import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { toLocale } from "@/i18n/routing";
import { hasActiveUser } from "@/lib/auth/guards";

import { RegisterForm } from "../register-form";

export default async function RegisterPage({
  params,
}: PageProps<"/[locale]/register">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  if (await hasActiveUser()) {
    return redirect({ href: "/", locale });
  }

  return <RegisterForm />;
}
