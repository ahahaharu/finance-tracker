import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type ConfirmProps = {
  message: string;
  error?: string;
  action: (formData: FormData) => Promise<void>;
  cancelHref: string;
  children?: ReactNode;
};

async function Confirm({
  message,
  error,
  action,
  cancelHref,
  children,
}: ConfirmProps) {
  const t = await getTranslations("dialog");

  return (
    <form action={action} className="flex w-full max-w-[320px] flex-col gap-4">
      {children}
      <p className="text-13 text-ink-muted">{message}</p>
      {error ? <p className="text-12 text-negative">{error}</p> : null}
      <div className="flex items-center gap-2">
        <Button type="submit" variant="destructiveSolid">
          {t("delete")}
        </Button>
        <Link
          href={cancelHref}
          scroll={false}
          className={buttonVariants({ variant: "ghost" })}
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}

export { Confirm };
