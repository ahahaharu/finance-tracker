import { cn } from "@/lib/utils";

type SkeletonProps = {
  rows?: number;
  columns?: number;
  header?: boolean;
  className?: string;
};

function Skeleton({
  rows = 1,
  columns = 4,
  header = true,
  className,
}: SkeletonProps) {
  return (
    <div className={cn("border border-line", className)}>
      {header ? <div className="h-8 border-b border-line bg-sunken" /> : null}
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className="flex h-row items-center gap-3 border-b border-line px-3 last:border-b-0"
        >
          {Array.from({ length: columns }, (_, column) => (
            <div
              key={column}
              className={cn(
                "h-3 rounded-[var(--radius)] bg-sunken",
                column === columns - 1 ? "ml-auto w-20" : "w-28",
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export { Skeleton };
