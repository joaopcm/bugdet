'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { useTransactionsFilters } from '../search-params'

export function ToReview() {
  const { data: transactions, isLoading } =
    trpc.transactions.countToReview.useQuery()
  const { searchParams, setSearchParams } = useTransactionsFilters()

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
    if (searchParams.ids.length > 0) {
      setSearchParams({
        ids: [],
      })
      return
    }

    setSearchParams({
      ids: transactions?.map((transaction) => transaction.id) ?? [],
      // Reset all other filters
      category: 'all',
      from: null,
      to: null,
      query: null,
    })
  }

  const isSelected = searchParams.ids.length > 0

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
      </TooltipContent>
    </Tooltip>
  )
}
