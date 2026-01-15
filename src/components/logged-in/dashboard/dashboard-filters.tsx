'use client'

import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import type { DateRange } from 'react-day-picker'
import {
  type DatePreset,
  getDateRangeFromPreset,
  getPresetLabel,
  useDashboardFilters,
} from './search-params'

const PRESET_BUTTONS: DatePreset[] = ['7d', '30d', '3m', '6m', 'ytd']

export function DashboardFilters() {
  const { filters, setFilters } = useDashboardFilters()

  const handlePresetClick = (preset: DatePreset) => {
    setFilters({ preset, from: null, to: null })
  }

  const handleCustomChange = (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) return
    setFilters({ preset: 'custom', from: range.from, to: range.to })
  }

  const customDateRange =
    filters.preset === 'custom' && filters.from && filters.to
      ? { from: filters.from, to: filters.to }
      : getDateRangeFromPreset('custom', filters.from, filters.to)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESET_BUTTONS.map((preset) => (
        <Button
          key={preset}
          variant={filters.preset === preset ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick(preset)}
        >
          {getPresetLabel(preset)}
        </Button>
      ))}

      <DateRangePicker
        value={customDateRange}
        onChange={handleCustomChange}
        preset={filters.preset === 'custom' ? 'custom' : undefined}
        placeholder="Custom"
        className={filters.preset === 'custom' ? '' : 'text-muted-foreground'}
      />
    </div>
  )
}
