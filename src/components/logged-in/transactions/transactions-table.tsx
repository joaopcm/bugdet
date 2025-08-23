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
import { MostExpensiveCategory } from './filters/badges/most-expensive-category'
import { MostExpensiveMerchant } from './filters/badges/most-expensive-merchant'
import { MostFrequentCategory } from './filters/badges/most-frequent-category'
import { MostFrequentMerchant } from './filters/badges/most-frequent-merchant'
import { ToReview } from './filters/badges/to-review'
import { CategoryFilter } from './filters/category-filter'
import { DateRangeFilter } from './filters/date-range-filter'
import { SearchFilter } from './filters/search-filter'
import { LoadingState } from './loading-state'
import { TransactionItem } from './transaction-item'
import { TransactionsPagination } from './transactions-pagination'

export const TransactionsTable = () => {
  const { data: transactions, isLoading } = useTransactions()

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-2">
        <SearchFilter />
        <DateRangeFilter />
        <CategoryFilter />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <ToReview />
        <MostExpensiveMerchant />
        <MostExpensiveCategory />
        <MostFrequentCategory />
        <MostFrequentMerchant />
      </div>
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

          {transactions?.data?.map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
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

      <TransactionsPagination hasMore={!!transactions?.hasMore} />
    </div>
  )
}
