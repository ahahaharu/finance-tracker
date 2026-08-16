import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

type CategoryDotProps = {
  color: string;
  name?: string;
  className?: string;
};

function CategoryDot({ color, name, className }: CategoryDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        data-category-color=""
        style={{ "--dot": color } as CSSProperties}
        className="size-1.5 rounded-[var(--radius)]"
      />
      {name ? <span className="text-12 text-ink-muted">{name}</span> : null}
    </span>
  );
}

export { CategoryDot };
