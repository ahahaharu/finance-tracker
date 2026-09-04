"use client";

import { useLinkStatus } from "next/link";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

function LinkPending({ className }: { className?: string }) {
  const { pending } = useLinkStatus();

  if (!pending) {
    return null;
  }

  return (
    <span
      aria-hidden
      className={cn(
        "flex opacity-0 [animation:pending-appear_120ms_ease-out_150ms_forwards]",
        className,
      )}
    >
      <LoaderCircle className="size-4 animate-spin" />
    </span>
  );
}

export { LinkPending };
