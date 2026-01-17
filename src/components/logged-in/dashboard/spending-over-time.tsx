"use client";

import { format, parseISO } from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { getActivePreset } from "@/components/logged-in/shared/date-range-filter";
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
import { getGroupByFromPreset, useDashboardFilters } from "./search-params";

const TRAILING_ZEROS_REGEX = /\.00$/;

const DATE_FORMAT_MAP: Record<"day" | "week" | "month", string> = {
  day: "MMM d",
  week: "MMM d",
  month: "MMM yyyy",
};

const chartConfig = {
  amount: {
    label: "Spending",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function SpendingOverTime() {
  const { filters } = useDashboardFilters();
  const activePreset = getActivePreset(filters.from, filters.to);
  const groupBy = getGroupByFromPreset(activePreset);

  const { data, isLoading } = trpc.dashboard.getSpendingOverTime.useQuery(
    {
      from: filters.from ? format(filters.from, "yyyy-MM-dd") : "",
      to: filters.to ? format(filters.to, "yyyy-MM-dd") : "",
      groupBy,
    },
    { enabled: !!filters.from && !!filters.to }
  );

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
    );
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
    );
  }

  const dateFormat = DATE_FORMAT_MAP[groupBy];

  const chartData = data.data.map((item) => ({
    date: format(parseISO(item.date), dateFormat),
    amount: item.amount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending over time</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[300px] w-full" config={chartConfig}>
          <AreaChart data={chartData} margin={{ left: 0, right: 16 }}>
            <defs>
              <linearGradient id="fillAmount" x1="0" x2="0" y1="0" y2="1">
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
              axisLine={false}
              dataKey="date"
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              tickFormatter={(value) =>
                formatCurrency(value, data.currency).replace(
                  TRAILING_ZEROS_REGEX,
                  ""
                )
              }
              tickLine={false}
              width={80}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <div className="flex items-center justify-between gap-4">
                      <span>Spent</span>
                      <span className="font-bold font-mono">
                        {formatCurrency(Number(value), data.currency)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey="amount"
              fill="url(#fillAmount)"
              stroke="var(--color-amount)"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
