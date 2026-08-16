import { cn } from "@/lib/utils";

type SkeletonProps = {
  rows?: number;
  className?: string;
};

function Skeleton({ rows = 1, className }: SkeletonProps) {
  return (
    <div className="flex flex-col gap-px">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className={cn("h-row rounded-[var(--radius)] bg-sunken", className)}
        />
      ))}
    </div>
  );
}

export { Skeleton };
