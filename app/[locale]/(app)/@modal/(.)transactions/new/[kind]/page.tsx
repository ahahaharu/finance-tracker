import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";

import { readKind } from "../../../../transactions/new/kind";
import { NewEntry } from "../../../../transactions/new/[kind]/new-entry";

export default async function NewEntryModal({
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

  return <NewEntry locale={locale} kind={kind} query={await searchParams} />;
}
