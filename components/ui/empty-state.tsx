import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  message: string;
  action?: ReactNode;
  className?: string;
};

function EmptyState({ message, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex items-center gap-4 py-6", className)}>
      <p className="text-13 text-ink-muted">{message}</p>
      {action}
    </div>
  );
}

export { EmptyState };
