'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table'
import { TableHeader } from '@/components/ui/table'
import { useTransactions } from '@/hooks/use-transactions'
import { EmptyState } from '../empty-state'
import { LoadingState } from './loading-state'
import { TransactionItem } from './transaction-item'

export function TransactionsTable() {
  const { data: transactions, isLoading } = useTransactions()

  return (
    <Table>
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

        {transactions?.map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} />
        ))}

        {transactions?.length === 0 && (
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
  )
}
