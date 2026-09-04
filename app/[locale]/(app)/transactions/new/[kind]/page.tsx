import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";

import { readKind } from "../kind";
import { NewEntry } from "./new-entry";

export default async function NewEntryPage({
  params,
  searchParams,
}: PageProps<"/[locale]/transactions/new/[kind]">) {
  const { locale: rawLocale, kind: rawKind } = await params;
  const locale = toLocale(rawLocale);

  setRequestLocale(locale);

  const kind = readKind(rawKind);

  if (!kind) {
    notFound();
  }

  const t = await getTranslations("transactions");

  return (
    <div className="flex w-full max-w-[320px] flex-col gap-section">
      <h1 className="text-20 font-medium">{t("form.createTitle")}</h1>
      <NewEntry locale={locale} kind={kind} query={await searchParams} />
    </div>
  );
}
