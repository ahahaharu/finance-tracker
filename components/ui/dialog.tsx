"use client";

import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";

const DialogCloseContext = createContext<(() => void) | null>(null);

function useDialogClose(): (() => void) | null {
  return useContext(DialogCloseContext);
}

function useCloseWhenDone(done: boolean | undefined) {
  const close = useDialogClose();
  const router = useRouter();
  const closed = useRef(false);

  useEffect(() => {
    if (!done || !close || closed.current) {
      return;
    }

    closed.current = true;
    close();
    router.refresh();
  }, [close, done, router]);
}

function DialogCancel({
  href,
  className,
  children,
}: {
  href: ComponentProps<typeof Link>["href"];
  className?: string;
  children: ReactNode;
}) {
  const close = useDialogClose();

  if (close) {
    return (
      <button type="button" onClick={close} className={className}>
        {children}
      </button>
    );
  }

  return (
    <Link href={href} scroll={false} className={className}>
      {children}
    </Link>
  );
}

function RouteDialog({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const t = useTranslations("dialog");
  const router = useRouter();
  const close = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) {
          close();
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
          <DialogCloseContext value={close}>{children}</DialogCloseContext>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { DialogCancel, RouteDialog, useCloseWhenDone, useDialogClose };
