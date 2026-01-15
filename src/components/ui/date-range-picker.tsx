'use client'

import { subDays, subMonths } from 'date-fns'
import { format } from 'date-fns'
import { CalendarIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { Button } from './button'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/lib/utils'

const PRESETS = [
  { id: '7d', label: 'Last 7 days', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { id: '30d', label: 'Last 30 days', getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { id: '3m', label: 'Last 3 months', getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
  { id: '6m', label: 'Last 6 months', getValue: () => ({ from: subMonths(new Date(), 6), to: new Date() }) },
] as const

export type DateRangePreset = (typeof PRESETS)[number]['id'] | 'custom'

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined, preset?: DateRangePreset) => void
  preset?: DateRangePreset
  showClear?: boolean
  className?: string
  placeholder?: string
}

export function DateRangePicker({
  value,
  onChange,
  preset,
  showClear = false,
  className,
  placeholder = 'Pick a date range',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const hasValue = !!value?.from && !!value?.to

  const handlePresetClick = (presetItem: (typeof PRESETS)[number]) => {
    const range = presetItem.getValue()
    onChange?.(range, presetItem.id)
    setIsOpen(false)
  }

  const handleCalendarSelect = (range: DateRange | undefined) => {
    onChange?.(range, 'custom')
    if (range?.from && range?.to) {
      setIsOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(undefined)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !hasValue && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {hasValue ? (
            `${format(value.from!, 'MMM d')} - ${format(value.to!, 'MMM d')}`
          ) : (
            <span>{placeholder}</span>
          )}
          {showClear && hasValue && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              aria-label="Clear date range"
              className="ml-auto size-7 -mr-1.5"
            >
              <XIcon className="opacity-50" />
            </Button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="flex flex-col gap-1 border-r p-3">
            {PRESETS.map((presetItem) => (
              <Button
                key={presetItem.id}
                variant={preset === presetItem.id ? 'default' : 'ghost'}
                size="sm"
                className="justify-start"
                onClick={() => handlePresetClick(presetItem)}
              >
                {presetItem.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={value}
            onSelect={handleCalendarSelect}
            captionLayout="dropdown"
            numberOfMonths={2}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
