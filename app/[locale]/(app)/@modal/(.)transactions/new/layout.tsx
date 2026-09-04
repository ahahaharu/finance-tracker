import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RouteDialog } from "@/components/ui/dialog";
import { toLocale } from "@/i18n/routing";

export default async function NewEntryModalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const t = await getTranslations("transactions");

  return (
    <RouteDialog title={t("form.createTitle")} closeHref="/transactions">
      {children}
    </RouteDialog>
  );
}
