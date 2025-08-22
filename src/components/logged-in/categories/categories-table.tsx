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
import { CategoryItem } from './category-item'
import { LoadingState } from './loading-state'

export function CategoriesTable() {
  const { data: categories, isLoading } = useCategories()

  return (
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

        {categories?.map((category) => (
          <CategoryItem key={category.id} category={category} />
        ))}

        {categories?.length === 0 && (
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
  )
}
