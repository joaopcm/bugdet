'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  DATE_PRESETS,
  type DatePreset,
  getPresetLabel,
  useDashboardFilters,
} from './search-params'

export function DashboardFilters() {
  const { filters, setFilters } = useDashboardFilters()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const selectedRange = useMemo(
    () => ({
      from: filters.from ? new Date(filters.from) : undefined,
      to: filters.to ? new Date(filters.to) : undefined,
    }),
    [filters.from, filters.to],
  )

  const handlePresetClick = (preset: DatePreset) => {
    if (preset === 'custom') {
      setIsCalendarOpen(true)
      return
    }
    setFilters({ preset, from: null, to: null })
  }

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from) {
      setFilters({ from: range.from, preset: 'custom' })
    }
    if (range?.to) {
      setFilters({ to: range.to, preset: 'custom' })
      setIsCalendarOpen(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {DATE_PRESETS.filter((p) => p !== 'custom').map((preset) => (
        <Button
          key={preset}
          variant={filters.preset === preset ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick(preset)}
        >
          {getPresetLabel(preset)}
        </Button>
      ))}

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={filters.preset === 'custom' ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'min-w-[140px] justify-start text-left font-normal',
              filters.preset !== 'custom' && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {filters.preset === 'custom' && filters.from && filters.to ? (
              `${format(filters.from, 'MMM d')} - ${format(filters.to, 'MMM d')}`
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={handleDateSelect}
            captionLayout="dropdown"
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
