import { cn } from "@/lib/utils";

type SectionTitleProps = {
  children: string;
  className?: string;
};

function SectionTitle({ children, className }: SectionTitleProps) {
  return (
    <h2
      className={cn(
        "text-13 font-medium tracking-[0.04em] text-ink",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export { SectionTitle };
