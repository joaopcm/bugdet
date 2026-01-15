'use client'

import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useBudgets } from '@/hooks/use-budgets'
import { useBulkSelection } from '@/hooks/use-bulk-selection'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { trpc } from '@/lib/trpc/client'
import { pluralize } from '@/lib/utils'
import { useMemo } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'
import { FloatingActionBar } from '../bulk-actions/floating-action-bar'
import { EmptyState } from '../empty-state'
import { BudgetItem } from './budget-item'
import { BudgetsPagination } from './budgets-pagination'
import { BudgetsFilters } from './filters'
import { LoadingState } from './loading-state'

export function BudgetsTable() {
  const isMobile = useIsMobile()
  const { data: budgets, isLoading, refetch } = useBudgets()

  const itemIds = useMemo(
    () => budgets?.data?.map((b) => b.id) ?? [],
    [budgets?.data],
  )

  const {
    selectedIds,
    isAllSelected,
    isPartiallySelected,
    handleClick,
    toggleAll,
    selectAll,
    clearSelection,
  } = useBulkSelection({ itemIds })

  useHotkeys('mod+a', selectAll, { preventDefault: true, enabled: !isMobile })

  const { mutate: deleteMany, isPending: isDeleting } =
    trpc.budgets.deleteMany.useMutation({
      onMutate: () => {
        toast.loading('Deleting budgets...', { id: 'delete-budgets' })
      },
      onSuccess: () => {
        toast.success(
          `Deleted ${selectedIds.size} ${pluralize(selectedIds.size, 'budget', 'budgets')}`,
          { id: 'delete-budgets' },
        )
        clearSelection()
        refetch()
      },
      onError: (error) => {
        toast.error(error.message, { id: 'delete-budgets' })
      },
    })

  const handleBulkDelete = () => {
    deleteMany({ ids: Array.from(selectedIds) })
  }

  return (
    <div className="flex flex-col gap-4">
      <BudgetsFilters />
      <div className="relative overflow-visible">
        <Checkbox
          checked={isAllSelected}
          indeterminate={isPartiallySelected}
          onCheckedChange={toggleAll}
          className="absolute -left-8 top-2.5 hidden opacity-0 hover:opacity-100 data-[state=checked]:opacity-100 data-[state=indeterminate]:opacity-100 md:block"
          aria-label="Select all budgets"
        />
        <Table containerClassName="overflow-visible">
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/5">Name</TableHead>
              <TableHead className="w-1/4">Categories</TableHead>
              <TableHead className="w-2/5">Progress</TableHead>
              <TableHead className="w-1/5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <LoadingState />}

            {budgets?.data.map((budget) => (
              <BudgetItem
                key={budget.id}
                budget={budget}
                isSelected={selectedIds.has(budget.id)}
                onSelect={handleClick}
              />
            ))}

            {budgets?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10">
                  <EmptyState
                    title="No budgets found."
                    description="Create your first budget to start tracking your spending goals."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <BudgetsPagination hasMore={!!budgets?.hasMore} />

      <FloatingActionBar
        selectedCount={selectedIds.size}
        onDelete={handleBulkDelete}
        isDeleting={isDeleting}
        className="w-[301px]"
      />
    </div>
  )
}
