import { ThemeToggle } from "@/components/theme-toggle";
import { Amount } from "@/components/ui/amount";
import { BudgetStatus } from "@/components/ui/budget-status";
import { Button } from "@/components/ui/button";
import { CategoryDot } from "@/components/ui/category-dot";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
  { name: "Продукты", color: "var(--cat-1)" },
  { name: "Транспорт", color: "var(--cat-2)" },
  { name: "Жильё", color: "var(--cat-3)" },
  { name: "Здоровье", color: "var(--cat-4)" },
  { name: "Развлечения", color: "var(--cat-5)" },
  { name: "Образование", color: "var(--cat-6)" },
  { name: "Одежда", color: "var(--cat-7)" },
  { name: "Кафе", color: "var(--cat-8)" },
  { name: "Связь", color: "var(--cat-9)" },
  { name: "Подарки", color: "var(--cat-10)" },
  { name: "Спорт", color: "var(--cat-11)" },
  { name: "Прочее", color: "var(--cat-12)" },
];

const walletOptions = [
  { value: "cash", label: "Наличные" },
  { value: "card", label: "Карта БПС" },
  { value: "savings", label: "Накопления" },
];

const typeScale = [
  { size: "text-11", label: "11 — мелкие метки и статусы" },
  { size: "text-12", label: "12 — подписи и метаданные" },
  { size: "text-13", label: "13 — интерфейсный текст" },
  { size: "text-14", label: "14 — акцентированный текст" },
  { size: "text-20", label: "20 — заголовок страницы" },
];

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

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-13 font-medium tracking-[0.04em] text-ink">
      {children}
    </h2>
  );
}

export default function ShowcasePage() {
  return (
    <div className="mx-auto w-full max-w-content px-page py-page">
      <header className="mb-section flex items-center justify-between border-b border-line pb-4">
        <h1 className="text-20 font-medium text-ink">Дизайн-система</h1>
        <ThemeToggle />
      </header>

      <div className="flex flex-col gap-section">
        <section className="flex flex-col gap-3">
          <SectionTitle>Служебные токены</SectionTitle>
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
          <SectionTitle>Палитра категорий</SectionTitle>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {categories.map((category) => (
              <CategoryDot
                key={category.name}
                color={category.color}
                name={category.name}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>Типографика</SectionTitle>
          <div className="flex flex-col gap-2">
            {typeScale.map((item) => (
              <p key={item.size} className={`${item.size} text-ink`}>
                {item.label}
              </p>
            ))}
            <p className="font-mono text-32 text-ink">32 — крупные суммы</p>
            <p className="font-mono text-44 text-ink">44 — общий баланс</p>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>Кнопки</SectionTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Добавить операцию</Button>
            <Button variant="secondary">Отмена</Button>
            <Button variant="ghost">Сбросить фильтры</Button>
            <Button variant="destructive">Удалить</Button>
            <Button variant="secondary" disabled>
              Недоступно
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>Поля ввода</SectionTitle>
          <div className="grid max-w-2xl grid-cols-3 gap-4">
            <Input label="Наименование" placeholder="Наличные" />
            <Input
              label="Начальный остаток"
              defaultValue="0,00"
              error="Введите сумму больше нуля"
            />
            <Select
              label="Счёт"
              placeholder="Выберите счёт"
              options={walletOptions}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>Операции</SectionTitle>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-sunken">
                <TableHead>Время</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Счёт</TableHead>
                <TableHead>Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableGroupRow
                date="16 августа"
                columns={5}
                total={<Amount minor={-8420} currency="BYN" type="NET" />}
              />
              <TableRow>
                <TableCell className="text-ink-muted">09:14</TableCell>
                <TableCell>Кофе на вынос</TableCell>
                <TableCell>
                  <CategoryDot color="var(--cat-8)" name="Кафе" />
                </TableCell>
                <TableCell className="text-ink-muted">Карта БПС</TableCell>
                <TableCell>
                  <Amount minor={620} currency="BYN" type="EXPENSE" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-ink-muted">13:02</TableCell>
                <TableCell>Продукты на неделю</TableCell>
                <TableCell>
                  <CategoryDot color="var(--cat-1)" name="Продукты" />
                </TableCell>
                <TableCell className="text-ink-muted">Карта БПС</TableCell>
                <TableCell>
                  <Amount minor={7800} currency="BYN" type="EXPENSE" />
                </TableCell>
              </TableRow>
              <TableGroupRow
                date="15 августа"
                columns={5}
                total={<Amount minor={214000} currency="BYN" type="NET" />}
              />
              <TableRow>
                <TableCell className="text-ink-muted">10:30</TableCell>
                <TableCell>Зарплата за июль</TableCell>
                <TableCell />
                <TableCell className="text-ink-muted">Карта БПС</TableCell>
                <TableCell>
                  <Amount minor={220000} currency="BYN" type="INCOME" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-ink-muted">18:45</TableCell>
                <TableCell>Подписка на сервис</TableCell>
                <TableCell>
                  <CategoryDot color="var(--cat-5)" name="Развлечения" />
                </TableCell>
                <TableCell className="text-ink-muted">Карта БПС</TableCell>
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
                  Итого по фильтру
                </TableCell>
                <TableCell>
                  <Amount minor={205580} currency="BYN" type="NET" />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>Суммы</SectionTitle>
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
            <span className="text-12 text-ink-muted">Общий баланс</span>
            <Amount
              minor={1284300}
              currency="BYN"
              size="hero"
              className="items-start"
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>Бюджеты</SectionTitle>
          <div className="flex flex-wrap items-center gap-4">
            <BudgetStatus ratio={0.42} />
            <BudgetStatus ratio={0.87} />
            <BudgetStatus ratio={1.2} />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>Пустое состояние</SectionTitle>
          <EmptyState
            message="За выбранный период операций нет."
            actionLabel="Сбросить фильтры"
          />
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>Загрузка</SectionTitle>
          <Skeleton rows={3} />
        </section>
      </div>
    </div>
  );
}
