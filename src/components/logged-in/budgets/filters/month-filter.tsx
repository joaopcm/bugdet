'use client'

import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { usePagination } from '@/hooks/use-pagination'
import { format, parse } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useBudgetsFilters } from './search-params'

const PREV_MONTH_SHORTCUT = '['
const NEXT_MONTH_SHORTCUT = ']'

export function MonthFilter() {
  const { budgetFilters, setBudgetFilters } = useBudgetsFilters()
  const { setPagination } = usePagination('budgets')

  const currentDate = parse(budgetFilters.month, 'yyyy-MM', new Date())

  const handlePrevMonth = () => {
    const prevMonth = new Date(currentDate)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    setBudgetFilters({ month: format(prevMonth, 'yyyy-MM') })
    setPagination({ page: 1 })
  }

  const handleNextMonth = () => {
    const nextMonth = new Date(currentDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    setBudgetFilters({ month: format(nextMonth, 'yyyy-MM') })
    setPagination({ page: 1 })
  }

  useHotkeys('BracketLeft', (e) => {
    e.preventDefault()
    handlePrevMonth()
  })

  useHotkeys('BracketRight', (e) => {
    e.preventDefault()
    handleNextMonth()
  })

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeftIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Or press <Kbd variant="outline">{PREV_MONTH_SHORTCUT}</Kbd> for
          previous month
        </TooltipContent>
      </Tooltip>

      <div className="min-w-[140px] text-center font-medium">
        {format(currentDate, 'MMMM yyyy')}
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Or press <Kbd variant="outline">{NEXT_MONTH_SHORTCUT}</Kbd> for next
          month
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
