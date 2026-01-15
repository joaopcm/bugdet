'use client'

import {
  DateRangePicker,
  type DateRangePreset,
} from '@/components/ui/date-range-picker'
import type { DateRange } from 'react-day-picker'
import {
  type DatePreset,
  getDateRangeFromPreset,
  useDashboardFilters,
} from './search-params'

const PRESET_MAP: Record<DateRangePreset, DatePreset> = {
  '7d': '7d',
  '30d': '30d',
  '3m': '3m',
  '6m': '6m',
  custom: 'custom',
}

export function DashboardFilters() {
  const { filters, setFilters } = useDashboardFilters()

  const dateRange = getDateRangeFromPreset(filters.preset, filters.from, filters.to)

  const handleChange = (range: DateRange | undefined, preset?: DateRangePreset) => {
    if (!range?.from || !range?.to) return

    if (preset && preset !== 'custom') {
      setFilters({ preset: PRESET_MAP[preset], from: null, to: null })
    } else {
      setFilters({ preset: 'custom', from: range.from, to: range.to })
    }
  }

  const currentPreset = filters.preset === 'ytd' ? 'custom' : filters.preset

  return (
    <DateRangePicker
      value={dateRange}
      onChange={handleChange}
      preset={currentPreset}
    />
  )
}
