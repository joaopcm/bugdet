import { BudgetsTable } from '@/components/logged-in/budgets/budgets-table'
import { CreateBudgetDialog } from '@/components/logged-in/budgets/create-budget-dialog'
import { RefreshButton } from '@/components/logged-in/budgets/refresh-button'
import { PageLayout } from '@/components/logged-in/page-layout'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Budgets',
}

export default function BudgetsPage() {
  return (
    <PageLayout.Root>
      <PageLayout.Header>
        <PageLayout.HeaderContent>
          <PageLayout.HeaderTitle title="Budgets" />
          <PageLayout.HeaderDescription description="Track spending goals by category." />
        </PageLayout.HeaderContent>

        <div className="flex items-center gap-2">
          <CreateBudgetDialog />
          <RefreshButton />
        </div>
      </PageLayout.Header>
      <BudgetsTable />
    </PageLayout.Root>
  )
}
