import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { toLocale } from "@/i18n/routing";
import { auth } from "@/lib/auth";

import { RegisterForm } from "../register-form";

export default async function RegisterPage({
  params,
}: PageProps<"/[locale]/register">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  if (await auth()) {
    return redirect({ href: "/", locale });
  }

  return <RegisterForm />;
}
