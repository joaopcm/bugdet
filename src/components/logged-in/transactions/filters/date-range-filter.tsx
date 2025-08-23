'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Kbd } from '@/components/ui/kbd'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTransactionsFilters } from './search-params'

const DATE_RANGE_SHORTCUT = 'D'

export function DateRangeFilter() {
  const { searchParams, setSearchParams } = useTransactionsFilters()
  const [isOpen, setIsOpen] = useState(false)

  const hasValues = !!searchParams.from && !!searchParams.to

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent popover from opening
    setSearchParams({
      from: null,
      to: null,
    })
  }

  useHotkeys(DATE_RANGE_SHORTCUT, (e) => {
    e.preventDefault()
    setIsOpen(true)
  })

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'pl-3 text-left font-normal active:scale-100 w-full',
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
          </TooltipTrigger>
          <TooltipContent>
            Or press <Kbd variant="outline">{DATE_RANGE_SHORTCUT}</Kbd> to pick
            a date range
          </TooltipContent>
        </Tooltip>
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
