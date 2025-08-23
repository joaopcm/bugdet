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
  const { transactionFilters, setTransactionFilters } = useTransactionsFilters()
  const [isOpen, setIsOpen] = useState(false)

  const hasValues = !!transactionFilters.from && !!transactionFilters.to

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent popover from opening
    setTransactionFilters({
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
              {!!transactionFilters.from && !!transactionFilters.to ? (
                `${format(transactionFilters.from, 'PP')} - ${format(transactionFilters.to, 'PP')}`
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
            from: transactionFilters.from
              ? new Date(transactionFilters.from)
              : undefined,
            to: transactionFilters.to
              ? new Date(transactionFilters.to)
              : undefined,
          }}
          onSelect={(value) => {
            if (value?.from) {
              setTransactionFilters({
                from: value.from,
              })
            }
            if (value?.to) {
              setTransactionFilters({
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
