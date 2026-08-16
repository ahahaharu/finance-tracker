"use client";

import { Field } from "@base-ui/react/field";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  options: readonly SelectOption[];
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
};

function Select({
  options,
  label,
  error,
  placeholder,
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
}: SelectProps) {
  const labels = Object.fromEntries(
    options.map((option) => [option.value, option.label]),
  );

  return (
    <Field.Root
      invalid={Boolean(error)}
      className={cn("flex flex-col gap-1.5", className)}
    >
      {label ? (
        <Field.Label
          nativeLabel={false}
          render={<span />}
          className="text-12 text-ink-muted"
        >
          {label}
        </Field.Label>
      ) : null}
      <SelectPrimitive.Root
        items={labels}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger className="flex h-control w-full items-center justify-between gap-2 rounded-[var(--radius)] border border-line-strong bg-bg px-3 text-13 text-ink select-none data-[disabled]:opacity-50 data-[invalid]:border-negative">
          <SelectPrimitive.Value placeholder={placeholder}>
            {(selected: string | null) =>
              selected === null ? (
                <span className="text-ink-faint">{placeholder}</span>
              ) : (
                labels[selected]
              )
            }
          </SelectPrimitive.Value>
          <SelectPrimitive.Icon className="text-ink-muted">
            <ChevronDown size={16} />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner sideOffset={4} alignItemWithTrigger={false}>
            <SelectPrimitive.Popup className="min-w-[var(--anchor-width)] rounded-[var(--radius)] border border-line bg-surface py-1 shadow-[0_4px_12px_rgb(0_0_0/0.08)] transition-opacity duration-[120ms] ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className="flex h-8 cursor-default items-center justify-between gap-3 px-3 text-13 text-ink select-none data-[highlighted]:bg-sunken"
                >
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="text-ink-muted">
                    <Check size={16} />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error ? <p className="text-12 text-negative">{error}</p> : null}
    </Field.Root>
  );
}

export { Select };
export type { SelectOption };
