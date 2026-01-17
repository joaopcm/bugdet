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
import { format, parseISO } from 'date-fns'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  getDateRangeFromPreset,
  getGroupByFromPreset,
  useDashboardFilters,
} from './search-params'

const chartConfig = {
  amount: {
    label: 'Spending',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

export function SpendingOverTime() {
  const { filters } = useDashboardFilters()
  const { from, to } = getDateRangeFromPreset(
    filters.preset,
    filters.from,
    filters.to,
  )
  const groupBy = getGroupByFromPreset(filters.preset)

  const { data, isLoading } = trpc.dashboard.getSpendingOverTime.useQuery({
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
    groupBy,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending over time</CardTitle>
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
          <CardTitle>Spending over time</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground text-sm">No transactions found</p>
        </CardContent>
      </Card>
    )
  }

  const dateFormat =
    groupBy === 'day' ? 'MMM d' : groupBy === 'week' ? 'MMM d' : 'MMM yyyy'

  const chartData = data.data.map((item) => ({
    date: format(parseISO(item.date), dateFormat),
    amount: item.amount,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending over time</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData} margin={{ left: 0, right: 16 }}>
            <defs>
              <linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-amount)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-amount)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={80}
              tickFormatter={(value) =>
                formatCurrency(value, data.currency).replace(/\.00$/, '')
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <div className="flex items-center justify-between gap-4">
                      <span>Spent</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(Number(value), data.currency)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--color-amount)"
              fill="url(#fillAmount)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
