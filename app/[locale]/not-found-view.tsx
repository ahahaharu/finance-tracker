import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function NotFoundView() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-20 font-medium">{t("title")}</h1>
      <p className="text-13 text-ink-muted">{t("description")}</p>
      <Link href="/" className={buttonVariants({ variant: "secondary" })}>
        {t("home")}
      </Link>
    </div>
  );
}
