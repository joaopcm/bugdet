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
// import { LoadingState } from './loading-state'
// import { TransactionItem } from './transaction-item'

export function CategoriesTable() {
  const { data: categories, isLoading } = useCategories()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Transactions</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* {isLoading && <LoadingState />} */}

        {categories?.map((category) => (
          <CategoryItem key={category.id} category={category} />
        ))}

        {categories?.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="py-10">
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
