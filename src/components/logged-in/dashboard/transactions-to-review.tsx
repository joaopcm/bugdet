"use client";
import { format, parseISO } from "date-fns";
import { CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { useDashboardFilters } from "./search-params";

function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

type TransactionData = {
  id: string;
  merchantName: string;
  date: string;
  amount: number;
  currency: string;
}[];

function TransactionContent({
  data,
  isLoading,
}: {
  data: TransactionData | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-1">
        <TransactionSkeleton />
        <TransactionSkeleton />
        <TransactionSkeleton />
        <TransactionSkeleton />
        <TransactionSkeleton />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center gap-2">
        <CheckCircleIcon className="size-8 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">All caught up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((tx) => (
        <div className="flex items-center justify-between" key={tx.id}>
          <div className="flex flex-col">
            <p className="font-medium text-sm leading-none">
              {tx.merchantName}
            </p>
            <p className="text-muted-foreground text-xs">
              {format(parseISO(tx.date), "MMM d, yyyy")}
            </p>
          </div>
          <span className="font-medium text-sm">
            {formatCurrency(tx.amount, tx.currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TransactionsToReview() {
  const { filters } = useDashboardFilters();

  const { data, isLoading } = trpc.dashboard.getTransactionsToReview.useQuery(
    {
      from: filters.from ? format(filters.from, "yyyy-MM-dd") : "",
      to: filters.to ? format(filters.to, "yyyy-MM-dd") : "",
      limit: 5,
    },
    { enabled: !!filters.from && !!filters.to }
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>To review</CardTitle>
        {data && data.length > 0 && (
          <Button asChild size="sm" variant="ghost">
            <Link
              href={`/transactions?${data.map((tx) => `ids=${tx.id}`).join("&")}`}
            >
              View all
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <TransactionContent data={data} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}
