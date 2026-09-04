import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius)] text-13 whitespace-nowrap select-none transition-opacity duration-[120ms] ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ink font-medium text-bg hover:opacity-90",
        secondary: "border border-line-strong text-ink hover:bg-sunken",
        ghost: "text-ink hover:bg-sunken",
        destructive: "text-negative hover:bg-sunken",
        destructiveSolid: "bg-negative font-medium text-bg hover:opacity-90",
      },
      size: {
        default: "h-control px-3",
        icon: "size-control",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
