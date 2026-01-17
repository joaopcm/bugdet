"use client";

import { format } from "date-fns";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { useDashboardFilters } from "./search-params";

const TRAILING_ZEROS_REGEX = /\.00$/;

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.55 0.15 280)",
  "oklch(0.70 0.18 140)",
  "oklch(0.60 0.20 340)",
  "oklch(0.75 0.12 230)",
  "oklch(0.58 0.22 25)",
  "oklch(0.65 0.14 110)",
  "oklch(0.72 0.16 320)",
];

export function SpendingByCategory() {
  const { filters } = useDashboardFilters();

  const { data, isLoading } = trpc.dashboard.getSpendingByCategory.useQuery(
    {
      from: filters.from ? format(filters.from, "yyyy-MM-dd") : "",
      to: filters.to ? format(filters.to, "yyyy-MM-dd") : "",
      limit: 8,
    },
    { enabled: !!filters.from && !!filters.to }
  );

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
    );
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
    );
  }

  const chartData = data.data.map((item, index) => ({
    category: item.categoryName,
    amount: item.totalAmount,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const chartConfig: ChartConfig = data.data.reduce((acc, item, index) => {
    acc[item.categoryName] = {
      label: item.categoryName,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[300px] w-full" config={chartConfig}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 0, right: 16 }}
          >
            <XAxis
              tickFormatter={(value) =>
                formatCurrency(value, data.currency).replace(
                  TRAILING_ZEROS_REGEX,
                  ""
                )
              }
              type="number"
            />
            <YAxis
              axisLine={false}
              dataKey="category"
              tickFormatter={(value) =>
                value.length > 12 ? `${value.slice(0, 12)}...` : value
              }
              tickLine={false}
              type="category"
              width={100}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex items-center justify-between gap-4">
                      <span>{name}</span>
                      <span className="font-bold font-mono">
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
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  key={`${entry.category}-${index}`}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
