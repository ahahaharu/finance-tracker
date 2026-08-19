import { Skeleton } from "@/components/ui/skeleton";

export default function BudgetsLoading() {
  return (
    <div className="flex flex-col gap-section">
      <Skeleton className="h-control w-40" />
      <Skeleton rows={5} />
    </div>
  );
}
