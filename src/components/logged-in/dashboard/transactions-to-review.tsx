'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
} from 'lucide-react'
import Link from 'next/link'
import { getDateRangeFromPreset, useDashboardFilters } from './search-params'

function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  )
}

export function TransactionsToReview() {
  const { filters } = useDashboardFilters()
  const { from, to } = getDateRangeFromPreset(
    filters.preset,
    filters.from,
    filters.to,
  )

  const { data, isLoading } = trpc.dashboard.getTransactionsToReview.useQuery({
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
    limit: 5,
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangleIcon className="size-4" />
          To Review
        </CardTitle>
        {data && data.length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/transactions?${data.map((tx) => `ids=${tx.id}`).join('&')}`}
            >
              View all
              <ExternalLinkIcon className="ml-1 size-3" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-1">
            <TransactionSkeleton />
            <TransactionSkeleton />
            <TransactionSkeleton />
            <TransactionSkeleton />
            <TransactionSkeleton />
          </div>
        ) : !data?.length ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2">
            <CheckCircleIcon className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium leading-none">
                    {tx.merchantName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {format(parseISO(tx.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {tx.confidence}%
                  </Badge>
                  <span className="text-sm font-medium">
                    {formatCurrency(tx.amount, tx.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
