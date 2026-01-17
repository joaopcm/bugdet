'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format, isSameDay, startOfYear, subDays, subMonths } from 'date-fns'
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

export function getDateRangeFromPreset(preset: Exclude<DatePreset, 'custom'>): {
  from: Date
  to: Date
} {
  const now = new Date()

  switch (preset) {
    case '7d':
      return { from: subDays(now, 7), to: now }
    case '30d':
      return { from: subDays(now, 30), to: now }
    case '3m':
      return { from: subMonths(now, 3), to: now }
    case '6m':
      return { from: subMonths(now, 6), to: now }
    case 'ytd':
      return { from: startOfYear(now), to: now }
  }
}

export function getActivePreset(
  from: Date | null,
  to: Date | null,
): DatePreset {
  if (!from || !to) return '30d'

  const presets = ['7d', '30d', '3m', '6m', 'ytd'] as const
  for (const preset of presets) {
    const range = getDateRangeFromPreset(preset)
    if (isSameDay(from, range.from) && isSameDay(to, range.to)) {
      return preset
    }
  }

  return 'custom'
}

interface DateRangeFilterProps {
  from: Date | null
  to: Date | null
  onFilterChange: (updates: { from: Date; to: Date }) => void
}

export function DateRangeFilter({
  from,
  to,
  onFilterChange,
}: DateRangeFilterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const activePreset = useMemo(() => getActivePreset(from, to), [from, to])

  const selectedRange = useMemo(
    () => ({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    }),
    [from, to],
  )

  const handlePresetClick = (preset: Exclude<DatePreset, 'custom'>) => {
    const range = getDateRangeFromPreset(preset)
    onFilterChange(range)
  }

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range?.from || !range?.to) return
    onFilterChange({ from: range.from, to: range.to })
    setIsCalendarOpen(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {DATE_PRESETS.filter((p) => p !== 'custom').map((presetOption) => (
        <Button
          key={presetOption}
          variant={activePreset === presetOption ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick(presetOption)}
        >
          {getPresetLabel(presetOption)}
        </Button>
      ))}

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={activePreset === 'custom' ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'min-w-[140px] justify-start text-left font-normal',
              activePreset !== 'custom' && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {activePreset === 'custom' && from && to ? (
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
