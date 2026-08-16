import { Field } from "@base-ui/react/field";

import { cn } from "@/lib/utils";

const controlClassName =
  "h-control w-full rounded-[var(--radius)] border border-line-strong bg-bg px-3 text-13 text-ink placeholder:text-ink-faint data-[invalid]:border-negative disabled:opacity-50";

type InputProps = Field.Control.Props & {
  label?: string;
  error?: string;
  fieldClassName?: string;
};

function Input({
  label,
  error,
  className,
  fieldClassName,
  ...props
}: InputProps) {
  return (
    <Field.Root
      invalid={Boolean(error)}
      className={cn("flex flex-col gap-1.5", fieldClassName)}
    >
      {label ? (
        <Field.Label className="text-12 text-ink-muted">{label}</Field.Label>
      ) : null}
      <Field.Control className={cn(controlClassName, className)} {...props} />
      {error ? <p className="text-12 text-negative">{error}</p> : null}
    </Field.Root>
  );
}

export { Input, controlClassName };
