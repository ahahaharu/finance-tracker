import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <table
      className={cn(
        "w-full border-collapse border border-line text-13 text-ink",
        className,
      )}
      {...props}
    />
  );
}

function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      className={cn("bg-sunken text-12 text-ink-muted", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn(className)} {...props} />;
}

function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn("h-row border-b border-line hover:bg-sunken", className)}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-8 px-3 text-left font-normal last:text-right",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-3 last:text-right", className)} {...props} />;
}

function TableGroupRow({
  date,
  total,
  columns,
}: {
  date: string;
  total: React.ReactNode;
  columns: number;
}) {
  return (
    <tr className="border-y border-line bg-sunken">
      <td className="h-8 px-3 text-12 text-ink-muted">{date}</td>
      <td className="px-3 text-right" colSpan={columns - 1}>
        {total}
      </td>
    </tr>
  );
}

function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      className={cn("sticky bottom-0 bg-sunken text-13 text-ink", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableGroupRow,
  TableHead,
  TableHeader,
  TableRow,
};
