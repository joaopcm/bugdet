'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table'
import { TableHeader } from '@/components/ui/table'
import { useCategories } from '@/hooks/use-categories'
import { EmptyState } from '../empty-state'
import { CategoriesPagination } from './categories-pagination'
import { CategoryItem } from './category-item'
import { CategoriesFilters } from './filters'
import { LoadingState } from './loading-state'

export function CategoriesTable() {
  const { data: categories, isLoading } = useCategories()

  return (
    <div className="flex flex-col gap-4">
      <CategoriesFilters />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/2">Name</TableHead>
            <TableHead className="w-1/4">Transactions</TableHead>
            <TableHead className="w-1/4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <LoadingState />}

          {categories?.data.map((category) => (
            <CategoryItem key={category.id} category={category} />
          ))}

          {categories?.data.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="py-10">
                <EmptyState
                  title="No categories found."
                  description="Upload your bank statements or create your first category to get started."
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <CategoriesPagination hasMore={!!categories?.hasMore} />
    </div>
  )
}
