'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MAX_TRANSACTIONS_PREVIEW } from '@/constants/categories'
import { trpc } from '@/lib/trpc/client'
import { cn, formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { type RefObject, useMemo, useRef } from 'react'
import { useHover } from 'usehooks-ts'

interface NameWithPreviewProps {
  id: string
  name: string
}

export function NameWithPreview({ id, name }: NameWithPreviewProps) {
  const hoverRef = useRef<HTMLButtonElement | null>(null)
  const isHovering = useHover(hoverRef as RefObject<HTMLButtonElement>)

  const { data: lastTransactions, isLoading } =
    trpc.categories.preview.useQuery(
      { id },
      {
        enabled: isHovering,
      },
    )

  const transactionsGroupedByDate = useMemo(() => {
    return (
      lastTransactions?.reduce(
        (acc, transaction) => {
          const date = format(transaction.date, 'MMM d, yyyy')
          acc[date] = [...(acc[date] || []), transaction]
          return acc
        },
        {} as Record<string, typeof lastTransactions>,
      ) ?? {}
    )
  }, [lastTransactions])

  const dates = Object.keys(transactionsGroupedByDate ?? {})

  return (
    <Tooltip>
      <TooltipTrigger
        ref={hoverRef}
        className="cursor-pointer underline decoration-dashed underline-offset-2"
      >
        {name}
      </TooltipTrigger>
      <TooltipContent side="right" className="p-0">
        <div className="px-3 py-1.5 overflow-y-auto max-h-48">
          <ul
            className={cn('grid gap-3 text-xs', {
              'min-w-48 max-w-56': !!lastTransactions?.length,
            })}
          >
            {isLoading && <li>Loading...</li>}

            {dates.map((date) => (
              <li key={date} className="grid gap-0.5">
                <span className="text-muted">{date}</span>
                <ul className="grid gap-0.5">
                  {transactionsGroupedByDate[date].map((transaction) => (
                    <TransactionPreviewItem
                      key={transaction.id}
                      date={transaction.date}
                      merchantName={transaction.merchantName}
                      amount={transaction.amount}
                      currency={transaction.currency}
                    />
                  ))}
                </ul>
              </li>
            ))}

            {lastTransactions?.length &&
              lastTransactions.length >= MAX_TRANSACTIONS_PREVIEW && (
                <li>
                  <span className="text-muted">More transactions...</span>
                </li>
              )}
          </ul>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

interface TransactionPreviewItemProps {
  date: string
  merchantName: string
  amount: number
  currency: string
}

function TransactionPreviewItem({
  date,
  merchantName,
  amount,
  currency,
}: TransactionPreviewItemProps) {
  return (
    <li>
      <span className="font-medium">
        {formatCurrency(amount, currency)} at {merchantName}
      </span>
    </li>
  )
}
