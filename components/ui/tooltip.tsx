"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import type { ReactElement } from "react";

type TooltipProps = {
  content: string;
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right";
};

function Tooltip({ content, children, side = "bottom" }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger delay={300} render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side={side} sideOffset={6}>
          <TooltipPrimitive.Popup className="rounded-[var(--radius)] border border-line bg-surface px-2 py-1 text-12 text-ink shadow-[0_4px_12px_rgb(0_0_0/0.08)] transition-opacity duration-[120ms] ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
            {content}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export { Tooltip };
