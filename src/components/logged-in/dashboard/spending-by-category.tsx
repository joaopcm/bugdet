'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts'
import { getDateRangeFromPreset, useDashboardFilters } from './search-params'

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function SpendingByCategory() {
  const { filters } = useDashboardFilters()
  const { from, to } = getDateRangeFromPreset(
    filters.preset,
    filters.from,
    filters.to,
  )

  const { data, isLoading } = trpc.dashboard.getSpendingByCategory.useQuery({
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
    limit: 8,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by category</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data?.data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by category</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground text-sm">No transactions found</p>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.data.map((item, index) => ({
    category: item.categoryName,
    amount: item.totalAmount,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }))

  const chartConfig: ChartConfig = data.data.reduce((acc, item, index) => {
    acc[item.categoryName] = {
      label: item.categoryName,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }
    return acc
  }, {} as ChartConfig)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 0, right: 16 }}
          >
            <XAxis
              type="number"
              tickFormatter={(value) =>
                formatCurrency(value, data.currency).replace(/\.00$/, '')
              }
            />
            <YAxis
              type="category"
              dataKey="category"
              tickLine={false}
              axisLine={false}
              width={100}
              tickFormatter={(value) =>
                value.length > 12 ? `${value.slice(0, 12)}...` : value
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex items-center justify-between gap-4">
                      <span>{name}</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(Number(value), data.currency)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="amount" radius={4}>
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.category}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
