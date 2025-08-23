'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useMostExpensiveCategory } from '@/hooks/use-most-expensive-category'
import { formatCurrency } from '@/lib/utils'
import { useTransactionsFilters } from '../search-params'

export function MostExpensiveCategory() {
  const { data: category, isLoading } = useMostExpensiveCategory()
  const { searchParams, setSearchParams } = useTransactionsFilters()

  if (isLoading) {
    return <Skeleton className="w-[151px] h-[24px]" />
  }

  if (!category) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="select-none">
            Most expensive category
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-64 text-pretty">
          I couldn't find the most expensive category in the last 45 days. Sorry
          about that.
        </TooltipContent>
      </Tooltip>
    )
  }

  function handleClick() {
    if (!category) {
      return
    }

    if (searchParams.category === category.categoryId) {
      setSearchParams({
        category: 'all',
      })
      return
    }

    setSearchParams({
      category: category.categoryId,
      // Reset all other filters
      ids: [],
      from: null,
      to: null,
      query: null,
    })
  }

  const isSelected = searchParams.category === category.categoryId

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={isSelected ? 'default' : 'outline'} clickable asChild>
          <button
            type="button"
            onClick={handleClick}
            className="transition-none"
          >
            Most expensive category
          </button>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64 text-pretty">
        Filter transactions by "{category.categoryName}", the most expensive
        category in the last 45 days. You've spent{' '}
        {formatCurrency(category.totalAmount, category.currency)} on them.
      </TooltipContent>
    </Tooltip>
  )
}
