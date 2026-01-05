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
import { useHotkeys } from 'react-hotkeys-hook'
import { useTransactionsFilters } from '../search-params'

const TO_REVIEW_SHORTCUT = '1'

/**
 * Displays a "To review" badge with a count and tooltip, and provides click and keyboard interactions to toggle the to-review transaction filter.
 *
 * When transaction data is loading a skeleton is rendered. If there are no transactions to review a non-interactive secondary badge with explanatory tooltip is shown. When transactions exist a badge shows the count and a tooltip; clicking the badge (or pressing the configured shortcut) toggles selecting all to-review transactions or clearing the selection and resets pagination and other filters.
 *
 * @returns The React element that renders the badge, tooltip, and associated interactions for filtering transactions that require review.
 */
export function ToReview() {
  const { data: transactions, isLoading } = useCountToReview()
  const { transactionFilters, setTransactionFilters } = useTransactionsFilters()
  const { setPagination } = usePagination('transactions')

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
            To review ({transactions?.length})
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