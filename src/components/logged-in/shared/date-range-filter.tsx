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

export const DATE_PRESETS = ['7d', '30d', '3m', '6m', 'ytd', 'custom'] as const
export type DatePreset = (typeof DATE_PRESETS)[number]

export function getPresetLabel(preset: DatePreset): string {
  switch (preset) {
    case '7d':
      return 'Last 7 days'
    case '30d':
      return 'Last 30 days'
    case '3m':
      return 'Last 3 months'
    case '6m':
      return 'Last 6 months'
    case 'ytd':
      return 'Year to date'
    case 'custom':
      return 'Custom'
  }
}

interface DateRangeFilterProps {
  preset: DatePreset
  from: Date | null
  to: Date | null
  onFilterChange: (updates: {
    preset?: DatePreset
    from?: Date | null
    to?: Date | null
  }) => void
}

export function DateRangeFilter({
  preset,
  from,
  to,
  onFilterChange,
}: DateRangeFilterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const selectedRange = useMemo(
    () => ({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    }),
    [from, to],
  )

  const handlePresetClick = (selectedPreset: DatePreset) => {
    if (selectedPreset === 'custom') {
      setIsCalendarOpen(true)
      return
    }
    onFilterChange({ preset: selectedPreset, from: null, to: null })
  }

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from) {
      onFilterChange({ from: range.from, preset: 'custom' })
    }
    if (range?.to) {
      onFilterChange({ to: range.to, preset: 'custom' })
      setIsCalendarOpen(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {DATE_PRESETS.filter((p) => p !== 'custom').map((presetOption) => (
        <Button
          key={presetOption}
          variant={preset === presetOption ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick(presetOption)}
        >
          {getPresetLabel(presetOption)}
        </Button>
      ))}

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={preset === 'custom' ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'min-w-[140px] justify-start text-left font-normal',
              preset !== 'custom' && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {preset === 'custom' && from && to ? (
              `${format(from, 'MMM d')} - ${format(to, 'MMM d')}`
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
