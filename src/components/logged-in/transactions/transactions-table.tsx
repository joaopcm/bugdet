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
import { useTransactions } from '@/hooks/use-transactions'
import { trpc } from '@/lib/trpc/client'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { FloatingActionBar } from '../bulk-actions/floating-action-bar'
import { EmptyState } from '../empty-state'
import { TransactionsFilters } from './filters'
import { LoadingState } from './loading-state'
import { TransactionItem } from './transaction-item'
import { TransactionsPagination } from './transactions-pagination'

export const TransactionsTable = () => {
  const { data: transactions, isLoading, refetch } = useTransactions()

  const itemIds = useMemo(
    () => transactions?.data?.map((t) => t.id) ?? [],
    [transactions?.data],
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
    trpc.transactions.deleteMany.useMutation({
      onSuccess: () => {
        toast.success(`Deleted ${selectedIds.size} transaction(s)`)
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
      <TransactionsFilters />
      <div className="relative overflow-visible">
        <Checkbox
          checked={isAllSelected}
          indeterminate={isPartiallySelected}
          onCheckedChange={toggleAll}
          className="absolute -left-8 top-2.5 opacity-0 hover:opacity-100 data-[state=checked]:opacity-100 data-[state=indeterminate]:opacity-100"
          aria-label="Select all transactions"
        />
        <Table containerClassName="overflow-visible">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[15%]">Date</TableHead>
              <TableHead className="w-[20%]">Category</TableHead>
              <TableHead className="w-[30%]">Merchant</TableHead>
              <TableHead className="w-[20%]">Amount</TableHead>
              <TableHead className="w-[15%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <LoadingState />}

            {transactions?.data?.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                isSelected={selectedIds.has(transaction.id)}
                onSelect={handleClick}
              />
            ))}

            {transactions?.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10">
                  <EmptyState
                    title="No transactions found."
                    description="Upload your bank statements to get started."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TransactionsPagination hasMore={!!transactions?.hasMore} />

      <FloatingActionBar
        selectedCount={selectedIds.size}
        onDelete={handleBulkDelete}
        isDeleting={isDeleting}
        className="w-[301px]"
      />
    </div>
  )
}
