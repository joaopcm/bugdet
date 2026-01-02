'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { StoreIcon } from 'lucide-react'
import { getDateRangeFromPreset, useDashboardFilters } from './search-params'

function MerchantSkeleton() {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  )
}

export function TopMerchants() {
  const { filters } = useDashboardFilters()
  const { from, to } = getDateRangeFromPreset(
    filters.preset,
    filters.from,
    filters.to,
  )

  const { data, isLoading } = trpc.dashboard.getTopMerchants.useQuery({
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
    limit: 5,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StoreIcon className="size-4" />
          Top Merchants
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-1">
            <MerchantSkeleton />
            <MerchantSkeleton />
            <MerchantSkeleton />
            <MerchantSkeleton />
            <MerchantSkeleton />
          </div>
        ) : !data?.data.length ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground text-sm">No merchants found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.data.map((merchant, index) => (
              <div
                key={merchant.merchantName}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="flex size-6 items-center justify-center rounded-full p-0 text-xs"
                  >
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {merchant.merchantName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {merchant.transactionCount} transaction
                      {merchant.transactionCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {formatCurrency(merchant.totalAmount, data.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
