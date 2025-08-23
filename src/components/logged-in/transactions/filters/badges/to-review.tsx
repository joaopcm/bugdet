'use client'

import { Badge } from '@/components/ui/badge'
import { Kbd } from '@/components/ui/kbd'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCountToReview } from '@/hooks/use-count-to-review'
import { usePagination } from '@/hooks/use-pagination'
import { cn } from '@/lib/utils'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTransactionsFilters } from '../search-params'

const TO_REVIEW_SHORTCUT = '1'

export function ToReview() {
  const { data: transactions, isLoading } = useCountToReview()
  const { transactionFilters, setTransactionFilters } = useTransactionsFilters()
  const { setPagination } = usePagination()

  useHotkeys(TO_REVIEW_SHORTCUT, () => handleClick())

  if (isLoading) {
    return <Skeleton className="w-[98px] h-[24px]" />
  }

  if (!transactions?.length) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="select-none">
            To review
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-64 text-pretty">
          There are no transactions to review. I'm pretty confident in my
          classifications.
        </TooltipContent>
      </Tooltip>
    )
  }

  function handleClick() {
    setPagination({ page: 1 })

    if (transactionFilters.ids.length > 0) {
      setTransactionFilters({
        ids: [],
      })
      return
    }

    setTransactionFilters({
      ids: transactions?.map((transaction) => transaction.id) ?? [],
      // Reset all other filters
      category: 'all',
      from: null,
      to: null,
      query: null,
    })
  }

  const isSelected = transactionFilters.ids.length > 0

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={isSelected ? 'default' : 'outline'} clickable asChild>
          <button
            type="button"
            onClick={handleClick}
            className="transition-none"
          >
            To review{' '}
            <div
              className={cn(
                'rounded-full size-4 flex items-center justify-center text-xs ml-1',
                {
                  'bg-primary text-primary-foreground': !isSelected,
                  'bg-muted text-muted-foreground': isSelected,
                },
              )}
            >
              {transactions?.length}
            </div>
          </button>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64 text-pretty">
        I wasn't entirely sure when classifying {transactions?.length}{' '}
        {transactions?.length === 1 ? 'transaction' : 'transactions'}. Click to
        list and review {transactions?.length === 1 ? 'it' : 'them'}.
        <br />
        <br />
        I'll improve my classification skills over time as you review them.
        <br />
        <br />
        Press <Kbd variant="outline">{TO_REVIEW_SHORTCUT}</Kbd> to activate this
        filter.
      </TooltipContent>
    </Tooltip>
  )
}
