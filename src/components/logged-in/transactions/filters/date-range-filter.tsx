'use client'

import {
  DateRangePicker,
  type DateRangePreset,
} from '@/components/ui/date-range-picker'
import { usePagination } from '@/hooks/use-pagination'
import type { DateRange } from 'react-day-picker'
import { useTransactionsFilters } from './search-params'

export function DateRangeFilter() {
  const { transactionFilters, setTransactionFilters } = useTransactionsFilters()
  const { setPagination } = usePagination('transactions')

  const value: DateRange | undefined =
    transactionFilters.from && transactionFilters.to
      ? { from: transactionFilters.from, to: transactionFilters.to }
      : undefined

  const handleChange = (range: DateRange | undefined, _preset?: DateRangePreset) => {
    if (!range) {
      setTransactionFilters({ from: null, to: null })
    } else {
      setTransactionFilters({ from: range.from ?? null, to: range.to ?? null })
    }
    setPagination({ page: 1 })
  }

  return (
    <DateRangePicker
      value={value}
      onChange={handleChange}
      showClear
      className="w-full"
    />
  )
}
