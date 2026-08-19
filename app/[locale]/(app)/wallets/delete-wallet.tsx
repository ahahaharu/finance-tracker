"use client";

import { useState, useTransition } from "react";
import type { Locale } from "next-intl";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { deleteWalletAction, type WalletFormState } from "./actions";

function DeleteWallet({
  walletId,
  locale,
}: {
  walletId: string;
  locale: Locale;
}) {
  const t = useTranslations("wallets");
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<WalletFormState>({});
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteWalletAction(locale, walletId);

      setState(result);
      setConfirming(false);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {confirming ? (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            onClick={() => setConfirming(false)}
            disabled={pending}
          >
            {t("actions.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            disabled={pending}
          >
            {t("actions.confirmDelete")}
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          onClick={() => {
            setState({});
            setConfirming(true);
          }}
        >
          {t("actions.delete")}
        </Button>
      )}
      {state.code ? (
        <p className="text-12 text-negative">
          {state.code === "WALLET_HAS_TRANSACTIONS"
            ? t("errors.WALLET_HAS_TRANSACTIONS", {
                count: state.transactionCount ?? 0,
              })
            : t(`errors.${state.code}`)}
        </p>
      ) : null}
    </div>
  );
}

export { DeleteWallet };
