'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { trpc } from '@/lib/trpc/client'
import { formatCurrency } from '@/lib/utils'
import { useTransactionsFilters } from '../search-params'

export function MostExpensiveMerchant() {
  const { data: merchant, isLoading } =
    trpc.transactions.getMostExpensiveMerchant.useQuery()
  const { searchParams, setSearchParams } = useTransactionsFilters()

  if (isLoading) {
    return <Skeleton className="w-[151px] h-[24px]" />
  }

  if (!merchant) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="select-none">
            Most expensive merchant
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-64 text-pretty">
          I couldn't find the most expensive merchant in the last 45 days. Sorry
          about that.
        </TooltipContent>
      </Tooltip>
    )
  }

  function handleClick() {
    if (!merchant) {
      return
    }

    if (searchParams.query === merchant.merchantName) {
      setSearchParams({
        query: null,
      })
      return
    }

    setSearchParams({
      query: merchant.merchantName,
      // Reset all other filters
      ids: [],
      from: null,
      to: null,
      category: 'all',
    })
  }

  const isSelected = searchParams.query === merchant.merchantName

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={isSelected ? 'default' : 'outline'} clickable asChild>
          <button
            type="button"
            onClick={handleClick}
            className="transition-none"
          >
            Most expensive merchant
          </button>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64 text-pretty">
        Filter transactions by "{merchant.merchantName}", the most expensive
        merchant in the last 45 days. You've spent{' '}
        {formatCurrency(merchant.totalAmount, merchant.currency)} on them.
      </TooltipContent>
    </Tooltip>
  )
}
