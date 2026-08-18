import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex justify-end gap-1 p-page">
        <LocaleSwitcher />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-start justify-center px-page pb-section">
        <div className="w-full max-w-[320px] pt-section">{children}</div>
      </main>
    </div>
  );
}
