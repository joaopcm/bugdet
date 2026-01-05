'use client'

import { Badge } from '@/components/ui/badge'
import { Kbd } from '@/components/ui/kbd'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useMostFrequentMerchant } from '@/hooks/use-most-frequent-merchant'
import { usePagination } from '@/hooks/use-pagination'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTransactionsFilters } from '../search-params'

const MOST_FREQUENT_MERCHANT_SHORTCUT = '5'

/**
 * Render a badge that toggles filtering transactions by the most frequent merchant observed in the last 45 days.
 *
 * Shows a loading skeleton while the merchant is being fetched; if no merchant is found it displays a secondary badge with an explanatory tooltip. When a merchant is available the badge indicates selection state, and clicking it (or pressing the '5' shortcut) applies or clears a filter by the merchant's name and resets pagination to page 1.
 *
 * @returns A JSX element containing the tooltip-wrapped badge (or skeleton) that toggles the most-frequent-merchant filter.
 */
export function MostFrequentMerchant() {
  const { data: merchant, isLoading } = useMostFrequentMerchant()
  const { transactionFilters, setTransactionFilters } = useTransactionsFilters()
  const { setPagination } = usePagination('transactions')

  useHotkeys(MOST_FREQUENT_MERCHANT_SHORTCUT, () => handleClick())

  if (isLoading) {
    return <Skeleton className="w-[151px] h-[24px]" />
  }

  if (!merchant) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="select-none">
            Most frequent merchant
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-64 text-pretty">
          I couldn't find the most frequent merchant in the last 45 days. Sorry
          about that.
        </TooltipContent>
      </Tooltip>
    )
  }

  function handleClick() {
    if (!merchant) {
      return
    }

    setPagination({ page: 1 })

    if (transactionFilters.query === merchant.merchantName) {
      setTransactionFilters({
        query: null,
      })
      return
    }

    setTransactionFilters({
      query: merchant.merchantName,
      // Reset all other filters
      ids: [],
      from: null,
      to: null,
      category: 'all',
    })
  }

  const isSelected = transactionFilters.query === merchant.merchantName

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={isSelected ? 'default' : 'outline'} clickable asChild>
          <button
            type="button"
            onClick={handleClick}
            className="transition-none"
          >
            Most frequent merchant
          </button>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64 text-pretty">
        Filter transactions by "{merchant.merchantName}", the most frequent
        merchant in the last 45 days.
        <br />
        <br />
        Press <Kbd variant="outline">{MOST_FREQUENT_MERCHANT_SHORTCUT}</Kbd> to
        activate this filter.
      </TooltipContent>
    </Tooltip>
  )
}