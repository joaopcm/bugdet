'use client'

import {
  type DatePreset,
  DateRangeFilter,
} from '@/components/logged-in/shared/date-range-filter'
import { useDashboardFilters } from './search-params'

export function DashboardFilters() {
  const { filters, setFilters } = useDashboardFilters()

  const handleFilterChange = (updates: {
    preset?: DatePreset
    from?: Date | null
    to?: Date | null
  }) => {
    setFilters(updates)
  }

  return (
    <DateRangeFilter
      preset={filters.preset}
      from={filters.from}
      to={filters.to}
      onFilterChange={handleFilterChange}
    />
  )
}
