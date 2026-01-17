'use client'

import {
  type DatePreset,
  DateRangeFilter as SharedDateRangeFilter,
} from '@/components/logged-in/shared/date-range-filter'
import { usePagination } from '@/hooks/use-pagination'
import { useTransactionsFilters } from './search-params'

export function DateRangeFilter() {
  const { transactionFilters, setTransactionFilters } = useTransactionsFilters()
  const { setPagination } = usePagination('transactions')

  const handleFilterChange = (updates: {
    preset?: DatePreset
    from?: Date | null
    to?: Date | null
  }) => {
    setTransactionFilters(updates)
    setPagination({ page: 1 })
  }

  return (
    <SharedDateRangeFilter
      preset={transactionFilters.preset}
      from={transactionFilters.from}
      to={transactionFilters.to}
      onFilterChange={handleFilterChange}
    />
  )
}
