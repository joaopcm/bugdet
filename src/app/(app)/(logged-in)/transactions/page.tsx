import { PageLayout } from '@/components/logged-in/page-layout'
import { RefreshButton } from '@/components/logged-in/transactions/refresh-button'
import { TransactionsTable } from '@/components/logged-in/transactions/transactions-table'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transactions',
}

export default function TransactionsPage() {
  return (
    <PageLayout.Root>
      <PageLayout.Header>
        <PageLayout.HeaderContent>
          <PageLayout.HeaderTitle title="Transactions" />
          <PageLayout.HeaderDescription description="View and manage your transactions." />
        </PageLayout.HeaderContent>
        <RefreshButton />
      </PageLayout.Header>
      <TransactionsTable />
    </PageLayout.Root>
  )
}
