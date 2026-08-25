import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Role } from "@/lib/generated/prisma/enums";
import type { AdminUserQuery } from "@/lib/schemas/admin";
import type { CollectionQuery } from "@/lib/schemas/collection";
import type { AccountView } from "@/lib/services/admin";

import { updateAccountAction } from "./actions";

async function AccountActions({
  account,
  filter,
  page,
  locale,
}: {
  account: AccountView;
  filter: AdminUserQuery;
  page: CollectionQuery;
  locale: Locale;
}) {
  const t = await getTranslations("admin");
  const nextRole = account.role === Role.ADMIN ? Role.USER : Role.ADMIN;

  return (
    <div className="flex items-center justify-end gap-1">
      <form action={updateAccountAction.bind(null, locale)}>
        <input type="hidden" name="userId" value={account.id} />
        <input type="hidden" name="role" value={nextRole} />
        <input type="hidden" name="q" value={filter.q ?? ""} />
        <input type="hidden" name="page" value={String(page.page)} />
        <Button type="submit" variant="ghost">
          {t(`actions.makeRole.${nextRole}`)}
        </Button>
      </form>

      <form action={updateAccountAction.bind(null, locale)}>
        <input type="hidden" name="userId" value={account.id} />
        <input
          type="hidden"
          name="isBlocked"
          value={account.isBlocked ? "false" : "true"}
        />
        <input type="hidden" name="q" value={filter.q ?? ""} />
        <input type="hidden" name="page" value={String(page.page)} />
        <Button
          type="submit"
          variant={account.isBlocked ? "ghost" : "destructive"}
        >
          {t(account.isBlocked ? "actions.unblock" : "actions.block")}
        </Button>
      </form>
    </div>
  );
}

export { AccountActions };
