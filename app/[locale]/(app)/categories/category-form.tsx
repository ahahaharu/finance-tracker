"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { CategoryDot } from "@/components/ui/category-dot";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Link } from "@/i18n/navigation";
import { CategoryKind } from "@/lib/generated/prisma/enums";
import { categoryColors } from "@/lib/schemas/category";
import { cn } from "@/lib/utils";

import type { CategoryFormState } from "./actions";

type CategoryValues = {
  name: string;
  kind: CategoryKind;
  color: string;
};

type CategoryFormProps = {
  action: (
    state: CategoryFormState,
    formData: FormData,
  ) => Promise<CategoryFormState>;
  category?: CategoryValues;
  defaultKind?: CategoryKind;
};

const initialState: CategoryFormState = {};

function CategoryForm({ action, category, defaultKind }: CategoryFormProps) {
  const t = useTranslations("categories");
  const [kind, setKind] = useState<string>(
    category?.kind ?? defaultKind ?? CategoryKind.EXPENSE,
  );
  const [color, setColor] = useState<string>(
    category?.color ?? categoryColors[0],
  );
  const [state, formAction, pending] = useActionState(action, initialState);

  const kindOptions = Object.values(CategoryKind).map((value) => ({
    value,
    label: t(`kinds.${value}`),
  }));

  return (
    <form
      action={formAction}
      className="flex w-full max-w-[320px] flex-col gap-4"
      noValidate
    >
      <Input
        name="name"
        defaultValue={category?.name}
        label={t("fields.name")}
        placeholder={t("placeholders.name")}
        error={
          state.code === "CATEGORY_NAME_TAKEN"
            ? t("errors.CATEGORY_NAME_TAKEN")
            : state.invalid?.includes("name")
              ? t("fieldErrors.name")
              : undefined
        }
      />

      {category ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-12 text-ink-muted">{t("fields.kind")}</span>
          <span className="text-13">{t(`kinds.${category.kind}`)}</span>
          <p className="text-12 text-ink-faint">{t("hints.kindFixed")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Select
            name="kind"
            value={kind}
            onValueChange={(value) => setKind(value ?? CategoryKind.EXPENSE)}
            options={kindOptions}
            label={t("fields.kind")}
            error={
              state.invalid?.includes("kind")
                ? t("fieldErrors.kind")
                : undefined
            }
          />
          <p className="text-12 text-ink-faint">{t("hints.kindFixed")}</p>
        </div>
      )}

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-12 text-ink-muted">{t("fields.color")}</legend>
        <div className="flex flex-wrap gap-1">
          {categoryColors.map((value, index) => (
            <label
              key={value}
              className={cn(
                "flex size-control cursor-default items-center justify-center rounded-[var(--radius)] border",
                value === color ? "border-ink" : "border-transparent",
              )}
            >
              <input
                type="radio"
                name="color"
                value={value}
                checked={value === color}
                onChange={() => setColor(value)}
                className="sr-only"
              />
              <CategoryDot color={value} />
              <span className="sr-only">
                {t("colorOption", { number: index + 1 })}
              </span>
            </label>
          ))}
        </div>
        {state.invalid?.includes("color") ? (
          <p className="text-12 text-negative">{t("fieldErrors.color")}</p>
        ) : null}
      </fieldset>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {category ? t("form.save") : t("form.create")}
        </Button>
        <Link
          href="/categories"
          className="flex h-control items-center px-3 text-13 text-ink-muted hover:text-ink"
        >
          {t("form.cancel")}
        </Link>
      </div>

      {state.code === "NOT_FOUND" ? (
        <p className="text-12 text-negative">{t("errors.NOT_FOUND")}</p>
      ) : null}
    </form>
  );
}

export { CategoryForm };
export type { CategoryValues };
