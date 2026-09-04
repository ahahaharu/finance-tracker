"use client";

import type { ReactNode } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

function RouteDialog({
  title,
  closeHref,
  children,
}: {
  title: string;
  closeHref: string;
  children: ReactNode;
}) {
  const t = useTranslations("dialog");
  const router = useRouter();

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) {
          router.push(closeHref, { scroll: false });
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 bg-[color-mix(in_oklch,var(--ink)_24%,transparent)] transition-opacity duration-[120ms] ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 flex max-h-[calc(100dvh-3rem)] w-[352px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-[var(--radius)] border border-line bg-surface p-4 shadow-[0_8px_24px_rgb(0_0_0/0.12)] transition-opacity duration-[120ms] ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
          <div className="flex items-start justify-between gap-4">
            <DialogPrimitive.Title className="text-14 font-medium text-ink">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label={t("close")}
              className="-mt-1 -mr-1 flex size-control shrink-0 items-center justify-center rounded-[var(--radius)] text-ink-muted hover:bg-sunken hover:text-ink"
            >
              <X size={16} />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { RouteDialog };
