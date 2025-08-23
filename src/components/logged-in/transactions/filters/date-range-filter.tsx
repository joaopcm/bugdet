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
import { CalendarIcon, XIcon } from 'lucide-react'
import { useTransactionsFilters } from './search-params'

export function DateRangeFilter() {
  const { searchParams, setSearchParams } = useTransactionsFilters()
  const hasValues = !!searchParams.from && !!searchParams.to

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent popover from opening
    setSearchParams({
      from: null,
      to: null,
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'pl-3 text-left font-normal active:scale-100',
            !hasValues && 'text-muted-foreground',
          )}
        >
          {!!searchParams.from && !!searchParams.to ? (
            `${format(searchParams.from, 'PP')} - ${format(searchParams.to, 'PP')}`
          ) : (
            <span>Pick a date range</span>
          )}
          <div className="ml-auto flex items-center">
            {hasValues ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                aria-label="Clear date range"
                className="size-7 -mr-1.5"
              >
                <XIcon className="opacity-50" />
              </Button>
            ) : (
              <CalendarIcon className="size-4 opacity-50" />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{
            from: searchParams.from ? new Date(searchParams.from) : undefined,
            to: searchParams.to ? new Date(searchParams.to) : undefined,
          }}
          onSelect={(value) => {
            if (value?.from) {
              setSearchParams({
                from: value.from,
              })
            }
            if (value?.to) {
              setSearchParams({
                to: value.to,
              })
            }
          }}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  )
}
