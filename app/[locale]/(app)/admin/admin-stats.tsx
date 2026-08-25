import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/components/ui/section-title";
import { requireUser } from "@/lib/auth/guards";
import { getStats } from "@/lib/services/admin";

import { RegistrationsChart } from "./registrations-chart";

async function AdminStats() {
  const user = await requireUser();
  const [stats, t] = await Promise.all([
    getStats(user, new Date()),
    getTranslations("admin"),
  ]);

  return (
    <div className="flex flex-col gap-section">
      <dl className="flex divide-x divide-line">
        <div className="flex flex-1 flex-col gap-1 pr-6">
          <dt className="text-12 text-ink-muted">{t("figures.users")}</dt>
          <dd className="text-32 text-ink">{stats.userCount}</dd>
        </div>
        <div className="flex flex-1 flex-col gap-1 px-6">
          <dt className="text-12 text-ink-muted">
            {t("figures.transactions")}
          </dt>
          <dd className="text-32 text-ink">{stats.transactionCount}</dd>
        </div>
      </dl>

      <section className="flex flex-col gap-3">
        <SectionTitle>{t("sections.registrations")}</SectionTitle>
        <RegistrationsChart points={stats.registrations} />
      </section>
    </div>
  );
}

export { AdminStats };
