import type { Metadata } from "next";
import { DashboardFilters } from "@/components/logged-in/dashboard/dashboard-filters";
import { SpendingByCategory } from "@/components/logged-in/dashboard/spending-by-category";
import { SpendingOverTime } from "@/components/logged-in/dashboard/spending-over-time";
import { SpendingSummaryCards } from "@/components/logged-in/dashboard/spending-summary-cards";
import { TopMerchants } from "@/components/logged-in/dashboard/top-merchants";
import { TransactionsToReview } from "@/components/logged-in/dashboard/transactions-to-review";
import { PageLayout } from "@/components/logged-in/page-layout";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <PageLayout.Root>
      <PageLayout.Header>
        <PageLayout.HeaderContent>
          <PageLayout.HeaderTitle title="Dashboard" />
          <PageLayout.HeaderDescription description="View your financial life." />
        </PageLayout.HeaderContent>
      </PageLayout.Header>

      <div className="grid gap-4">
        <DashboardFilters />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SpendingSummaryCards />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SpendingByCategory />
          <SpendingOverTime />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TopMerchants />
          <TransactionsToReview />
        </div>
      </div>
    </PageLayout.Root>
  );
}
