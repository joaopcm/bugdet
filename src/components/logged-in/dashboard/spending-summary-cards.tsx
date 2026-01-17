'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import {
  CreditCardIcon,
  DollarSignIcon,
  TagIcon,
  TrendingUpIcon,
} from 'lucide-react'
import { useDashboardFilters } from './search-params'

function SummaryCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-1 h-3 w-20" />
      </CardContent>
    </Card>
  )
}

export function SpendingSummaryCards() {
  const { filters } = useDashboardFilters()

  const { data: summary, isLoading } =
    trpc.dashboard.getSpendingSummary.useQuery(
      {
        from: filters.from ? format(filters.from, 'yyyy-MM-dd') : '',
        to: filters.to ? format(filters.to, 'yyyy-MM-dd') : '',
      },
      { enabled: !!filters.from && !!filters.to },
    )

  if (isLoading) {
    return (
      <>
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </>
    )
  }

  if (!summary) return null

  const cards = [
    {
      title: 'Total spent',
      value: formatCurrency(summary.totalSpent, summary.currency),
      icon: DollarSignIcon,
      description: summary.hasOtherCurrencies
        ? 'Primary currency only'
        : undefined,
    },
    {
      title: 'Transactions',
      value: summary.transactionCount.toLocaleString(),
      icon: CreditCardIcon,
      description: 'Total transactions',
    },
    {
      title: 'Average',
      value: formatCurrency(summary.avgAmount, summary.currency),
      icon: TrendingUpIcon,
      description: 'Per transaction',
    },
    {
      title: 'Categories',
      value: summary.categoryCount.toLocaleString(),
      icon: TagIcon,
      description: summary.categoryCount === 0 ? 'No categories yet' : 'Used',
    },
  ]

  return (
    <>
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.description && (
              <p className="text-muted-foreground text-xs">
                {card.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </>
  )
}
