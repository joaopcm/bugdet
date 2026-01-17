import type { Metadata } from "next";
import { PageLayout } from "@/components/logged-in/page-layout";
import { CreateTransactionDialog } from "@/components/logged-in/transactions/create-transaction-dialog";
import { RefreshButton } from "@/components/logged-in/transactions/refresh-button";
import { TransactionsTable } from "@/components/logged-in/transactions/transactions-table";

export const metadata: Metadata = {
  title: "Transactions",
};

export default function TransactionsPage() {
  return (
    <PageLayout.Root>
      <PageLayout.Header>
        <PageLayout.HeaderContent>
          <PageLayout.HeaderTitle title="Transactions" />
          <PageLayout.HeaderDescription description="View and manage your transactions." />
        </PageLayout.HeaderContent>

        <div className="flex items-center gap-2">
          <CreateTransactionDialog />
          <RefreshButton />
        </div>
      </PageLayout.Header>
      <TransactionsTable />
    </PageLayout.Root>
  );
}
