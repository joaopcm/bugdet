import { CategoriesTable } from '@/components/logged-in/categories/categories-table'
import { PageLayout } from '@/components/logged-in/page-layout'
import { RefreshButton } from '@/components/logged-in/transactions/refresh-button'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Categories',
}

export default function CategoriesPage() {
  return (
    <PageLayout.Root>
      <PageLayout.Header>
        <PageLayout.HeaderContent>
          <PageLayout.HeaderTitle title="Categories" />
          <PageLayout.HeaderDescription description="View and manage your categories." />
        </PageLayout.HeaderContent>
        <RefreshButton />
      </PageLayout.Header>
      <CategoriesTable />
    </PageLayout.Root>
  )
}
