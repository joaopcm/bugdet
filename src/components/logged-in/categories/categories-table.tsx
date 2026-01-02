'use client'

import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table'
import { TableHeader } from '@/components/ui/table'
import { useBulkSelection } from '@/hooks/use-bulk-selection'
import { useCategories } from '@/hooks/use-categories'
import { trpc } from '@/lib/trpc/client'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { FloatingActionBar } from '../bulk-actions/floating-action-bar'
import { EmptyState } from '../empty-state'
import { CategoriesPagination } from './categories-pagination'
import { CategoryItem } from './category-item'
import { CategoriesFilters } from './filters'
import { LoadingState } from './loading-state'

export function CategoriesTable() {
  const { data: categories, isLoading, refetch } = useCategories()

  const itemIds = useMemo(
    () => categories?.data?.map((c) => c.id) ?? [],
    [categories?.data],
  )

  const {
    selectedIds,
    isAllSelected,
    isPartiallySelected,
    handleClick,
    toggleAll,
    clearSelection,
  } = useBulkSelection({ itemIds })

  const { mutate: deleteMany, isPending: isDeleting } =
    trpc.categories.deleteMany.useMutation({
      onSuccess: () => {
        toast.success(`Deleted ${selectedIds.size} category(s)`)
        clearSelection()
        refetch()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  const handleBulkDelete = () => {
    deleteMany({ ids: Array.from(selectedIds) })
  }

  return (
    <div className="flex flex-col gap-4">
      <CategoriesFilters />
      <div className="relative overflow-visible">
        <Checkbox
          checked={isAllSelected}
          indeterminate={isPartiallySelected}
          onCheckedChange={toggleAll}
          className="absolute -left-8 top-2.5 opacity-0 hover:opacity-100 data-[state=checked]:opacity-100 data-[state=indeterminate]:opacity-100"
          aria-label="Select all categories"
        />
        <Table containerClassName="overflow-visible">
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
              <CategoryItem
                key={category.id}
                category={category}
                isSelected={selectedIds.has(category.id)}
                onSelect={handleClick}
              />
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
      </div>

      <CategoriesPagination hasMore={!!categories?.hasMore} />

      <FloatingActionBar
        selectedCount={selectedIds.size}
        onDelete={handleBulkDelete}
        isDeleting={isDeleting}
        className="w-[301px]"
      />
    </div>
  )
}
