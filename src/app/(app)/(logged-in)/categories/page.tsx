import { CategoriesTable } from '@/components/logged-in/categories/categories-table'
import { CreateCategoryDialog } from '@/components/logged-in/categories/create-category-dialog'
import { RefreshButton } from '@/components/logged-in/categories/refresh-button'
import { PageLayout } from '@/components/logged-in/page-layout'
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

        <div className="flex items-center gap-2">
          <CreateCategoryDialog />
          <RefreshButton />
        </div>
      </PageLayout.Header>
      <CategoriesTable />
    </PageLayout.Root>
  )
}
