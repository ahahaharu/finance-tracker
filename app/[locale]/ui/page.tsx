import { use } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Amount } from "@/components/ui/amount";
import { BudgetStatus } from "@/components/ui/budget-status";
import { Button } from "@/components/ui/button";
import { CategoryDot } from "@/components/ui/category-dot";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toLocale } from "@/i18n/routing";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableGroupRow,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const categories = [
  { key: "groceries", color: "var(--cat-1)" },
  { key: "transport", color: "var(--cat-2)" },
  { key: "housing", color: "var(--cat-3)" },
  { key: "health", color: "var(--cat-4)" },
  { key: "entertainment", color: "var(--cat-5)" },
  { key: "education", color: "var(--cat-6)" },
  { key: "clothing", color: "var(--cat-7)" },
  { key: "cafe", color: "var(--cat-8)" },
  { key: "communication", color: "var(--cat-9)" },
  { key: "gifts", color: "var(--cat-10)" },
  { key: "sport", color: "var(--cat-11)" },
  { key: "other", color: "var(--cat-12)" },
] as const;

const accountKeys = ["cash", "card", "savings"] as const;

const typeScale = [
  { size: "text-11", key: "micro" },
  { size: "text-12", key: "caption" },
  { size: "text-13", key: "body" },
  { size: "text-14", key: "emphasis" },
  { size: "text-20", key: "heading" },
] as const;

const tokens = [
  { name: "--bg", className: "bg-bg" },
  { name: "--surface", className: "bg-surface" },
  { name: "--sunken", className: "bg-sunken" },
  { name: "--line", className: "bg-line" },
  { name: "--line-strong", className: "bg-line-strong" },
  { name: "--ink", className: "bg-ink" },
  { name: "--ink-muted", className: "bg-ink-muted" },
  { name: "--ink-faint", className: "bg-ink-faint" },
  { name: "--positive", className: "bg-positive" },
  { name: "--warning", className: "bg-warning" },
  { name: "--negative", className: "bg-negative" },
];

const today = new Date("2026-08-16T00:00:00+03:00");
const yesterday = new Date("2026-08-15T00:00:00+03:00");

const dayFormat = { day: "numeric", month: "long" } as const;
const timeFormat = { hour: "2-digit", minute: "2-digit" } as const;

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-13 font-medium tracking-[0.04em] text-ink">
      {children}
    </h2>
  );
}

export default function ShowcasePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(toLocale(locale));

  const t = useTranslations("showcase");
  const format = useFormatter();

  const accountOptions = accountKeys.map((key) => ({
    value: key,
    label: t(`accounts.${key}`),
  }));

  return (
    <div className="mx-auto w-full max-w-content px-page py-page">
      <header className="mb-section flex items-center justify-between border-b border-line pb-4">
        <h1 className="text-20 font-medium text-ink">{t("title")}</h1>
        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-col gap-section">
        <section className="flex flex-col gap-3">
          <SectionTitle>{t("sections.tokens")}</SectionTitle>
          <div className="flex flex-wrap gap-4">
            {tokens.map((token) => (
              <div key={token.name} className="flex flex-col gap-1.5">
                <div
                  className={`h-10 w-28 rounded-[var(--radius)] border border-line ${token.className}`}
                />
                <span className="font-mono text-11 text-ink-muted">
                  {token.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>{t("sections.categories")}</SectionTitle>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {categories.map((category) => (
              <CategoryDot
                key={category.key}
                color={category.color}
                name={t(`categories.${category.key}`)}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>{t("sections.typography")}</SectionTitle>
          <div className="flex flex-col gap-2">
            {typeScale.map((item) => (
              <p key={item.size} className={`${item.size} text-ink`}>
                {t(`typography.${item.key}`)}
              </p>
            ))}
            <p className="font-mono text-32 text-ink">
              {t("typography.amount")}
            </p>
            <p className="font-mono text-44 text-ink">{t("typography.hero")}</p>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>{t("sections.buttons")}</SectionTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">{t("buttons.primary")}</Button>
            <Button variant="secondary">{t("buttons.secondary")}</Button>
            <Button variant="ghost">{t("buttons.ghost")}</Button>
            <Button variant="destructive">{t("buttons.destructive")}</Button>
            <Button variant="secondary" disabled>
              {t("buttons.disabled")}
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>{t("sections.inputs")}</SectionTitle>
          <div className="grid max-w-2xl grid-cols-3 gap-4">
            <Input
              label={t("inputs.nameLabel")}
              placeholder={t("inputs.namePlaceholder")}
            />
            <Input
              label={t("inputs.openingBalanceLabel")}
              defaultValue={t("inputs.openingBalanceValue")}
              error={t("inputs.openingBalanceError")}
            />
            <Select
              label={t("inputs.accountLabel")}
              placeholder={t("inputs.accountPlaceholder")}
              options={accountOptions}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>{t("sections.transactions")}</SectionTitle>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-sunken">
                <TableHead>{t("table.time")}</TableHead>
                <TableHead>{t("table.description")}</TableHead>
                <TableHead>{t("table.category")}</TableHead>
                <TableHead>{t("table.account")}</TableHead>
                <TableHead>{t("table.amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableGroupRow
                date={format.dateTime(today, dayFormat)}
                columns={5}
                total={<Amount minor={-8420} currency="BYN" type="NET" />}
              />
              <TableRow>
                <TableCell className="text-ink-muted">
                  {format.dateTime(
                    new Date("2026-08-16T09:14:00+03:00"),
                    timeFormat,
                  )}
                </TableCell>
                <TableCell>{t("transactions.coffee")}</TableCell>
                <TableCell>
                  <CategoryDot
                    color="var(--cat-8)"
                    name={t("categories.cafe")}
                  />
                </TableCell>
                <TableCell className="text-ink-muted">
                  {t("accounts.card")}
                </TableCell>
                <TableCell>
                  <Amount minor={620} currency="BYN" type="EXPENSE" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-ink-muted">
                  {format.dateTime(
                    new Date("2026-08-16T13:02:00+03:00"),
                    timeFormat,
                  )}
                </TableCell>
                <TableCell>{t("transactions.groceries")}</TableCell>
                <TableCell>
                  <CategoryDot
                    color="var(--cat-1)"
                    name={t("categories.groceries")}
                  />
                </TableCell>
                <TableCell className="text-ink-muted">
                  {t("accounts.card")}
                </TableCell>
                <TableCell>
                  <Amount minor={7800} currency="BYN" type="EXPENSE" />
                </TableCell>
              </TableRow>
              <TableGroupRow
                date={format.dateTime(yesterday, dayFormat)}
                columns={5}
                total={<Amount minor={214000} currency="BYN" type="NET" />}
              />
              <TableRow>
                <TableCell className="text-ink-muted">
                  {format.dateTime(
                    new Date("2026-08-15T10:30:00+03:00"),
                    timeFormat,
                  )}
                </TableCell>
                <TableCell>{t("transactions.salary")}</TableCell>
                <TableCell />
                <TableCell className="text-ink-muted">
                  {t("accounts.card")}
                </TableCell>
                <TableCell>
                  <Amount minor={220000} currency="BYN" type="INCOME" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-ink-muted">
                  {format.dateTime(
                    new Date("2026-08-15T18:45:00+03:00"),
                    timeFormat,
                  )}
                </TableCell>
                <TableCell>{t("transactions.subscription")}</TableCell>
                <TableCell>
                  <CategoryDot
                    color="var(--cat-5)"
                    name={t("categories.entertainment")}
                  />
                </TableCell>
                <TableCell className="text-ink-muted">
                  {t("accounts.card")}
                </TableCell>
                <TableCell>
                  <Amount
                    minor={500}
                    currency="USD"
                    type="EXPENSE"
                    baseMinor={1625}
                    baseCurrency="BYN"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow className="hover:bg-sunken">
                <TableCell colSpan={4} className="text-12 text-ink-muted">
                  {t("table.filterTotal")}
                </TableCell>
                <TableCell>
                  <Amount minor={205580} currency="BYN" type="NET" />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>{t("sections.amounts")}</SectionTitle>
          <div className="flex flex-wrap items-start gap-8">
            <Amount minor={124560} currency="BYN" />
            <Amount minor={124560} currency="BYN" type="INCOME" />
            <Amount minor={124560} currency="BYN" type="EXPENSE" />
            <Amount minor={-32100} currency="BYN" type="NET" />
            <Amount
              minor={5000}
              currency="USD"
              type="TRANSFER_IN"
              baseMinor={16250}
              baseCurrency="BYN"
            />
          </div>
          <div className="mt-2 flex flex-col gap-1 border border-line bg-surface p-4">
            <span className="text-12 text-ink-muted">{t("totalBalance")}</span>
            <Amount
              minor={1284300}
              currency="BYN"
              size="hero"
              className="items-start"
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>{t("sections.budgets")}</SectionTitle>
          <div className="flex flex-wrap items-center gap-4">
            <BudgetStatus ratio={0.42} />
            <BudgetStatus ratio={0.87} />
            <BudgetStatus ratio={1.2} />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>{t("sections.empty")}</SectionTitle>
          <EmptyState
            message={t("emptyMessage")}
            action={
              <Button variant="secondary">{t("emptyAction")}</Button>
            }
          />
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>{t("sections.loading")}</SectionTitle>
          <Skeleton rows={3} />
        </section>
      </div>
    </div>
  );
}
