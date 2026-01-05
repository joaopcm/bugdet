'use client'

import { Badge } from '@/components/ui/badge'
import { Kbd } from '@/components/ui/kbd'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useMostFrequentCategory } from '@/hooks/use-most-frequent-category'
import { usePagination } from '@/hooks/use-pagination'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTransactionsFilters } from '../search-params'

const MOST_FREQUENT_CATEGORY_SHORTCUT = '4'

/**
 * Renders a badge for the most frequent transaction category and enables filtering transactions by that category.
 *
 * When loading, renders a skeleton. If no category is found, renders a disabled/secondary badge with explanatory tooltip.
 * Clicking the badge (or pressing the configured hotkey) sets pagination to page 1 and toggles the category filter:
 * if the current filter already matches the most frequent category it clears the category to `"all"`;
 * otherwise it applies the category and resets other filters (`ids`, `from`, `to`, `query`).
 *
 * @returns The component's rendered React element.
 */
export function MostFrequentCategory() {
  const { data: category, isLoading } = useMostFrequentCategory()
  const { transactionFilters, setTransactionFilters } = useTransactionsFilters()
  const { setPagination } = usePagination('transactions')

  useHotkeys(MOST_FREQUENT_CATEGORY_SHORTCUT, () => handleClick())

  if (isLoading) {
    return <Skeleton className="w-[151px] h-[24px]" />
  }

  if (!category) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="select-none">
            Most frequent category
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-64 text-pretty">
          I couldn't find the most frequent category in the last 45 days. Sorry
          about that.
        </TooltipContent>
      </Tooltip>
    )
  }

  function handleClick() {
    if (!category) {
      return
    }

    setPagination({ page: 1 })

    if (transactionFilters.category === category.categoryId) {
      setTransactionFilters({
        category: 'all',
      })
      return
    }

    setTransactionFilters({
      category: category.categoryId,
      // Reset all other filters
      ids: [],
      from: null,
      to: null,
      query: null,
    })
  }

  const isSelected = transactionFilters.category === category.categoryId

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={isSelected ? 'default' : 'outline'} clickable asChild>
          <button
            type="button"
            onClick={handleClick}
            className="transition-none"
          >
            Most frequent category
          </button>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64 text-pretty">
        Filter transactions by "{category.categoryName}", the most frequent
        category in the last 45 days.
        <br />
        <br />
        Press <Kbd variant="outline">{MOST_FREQUENT_CATEGORY_SHORTCUT}</Kbd> to
        activate this filter.
      </TooltipContent>
    </Tooltip>
  )
}