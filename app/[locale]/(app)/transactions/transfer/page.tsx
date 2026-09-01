import { format } from "date-fns";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { toLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { decodeFailure } from "@/lib/forms/state";
import { balanceOptions, listWallets } from "@/lib/services/wallet";

import { createTransferAction } from "./actions";
import { transferFormErrorCodes } from "./failure";
import { TransferForm } from "./transfer-form";

export default async function NewTransferPage({
  params,
  searchParams,
}: PageProps<"/[locale]/transactions/transfer">) {
  const locale = toLocale((await params).locale);

  setRequestLocale(locale);

  const user = await requireUser();
  const [wallets, t] = await Promise.all([
    listWallets(user.id, balanceOptions(user)),
    getTranslations("transfers"),
  ]);

  return (
    <div className="flex flex-col gap-section">
      <h1 className="text-20 font-medium">{t("title")}</h1>

      {wallets.items.length < 2 ? (
        <p className="text-13 text-ink-muted">{t("needsTwoWallets")}</p>
      ) : (
        <TransferForm
          action={createTransferAction.bind(null, locale)}
          wallets={wallets.items}
          now={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
          initialState={decodeFailure(await searchParams, transferFormErrorCodes)}
        />
      )}
    </div>
  );
}
