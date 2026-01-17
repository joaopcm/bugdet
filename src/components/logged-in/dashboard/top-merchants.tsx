"use client";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { useDashboardFilters } from "./search-params";

function MerchantSkeleton() {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export function TopMerchants() {
  const { filters } = useDashboardFilters();

  const { data, isLoading } = trpc.dashboard.getTopMerchants.useQuery(
    {
      from: filters.from ? format(filters.from, "yyyy-MM-dd") : "",
      to: filters.to ? format(filters.to, "yyyy-MM-dd") : "",
      limit: 5,
    },
    { enabled: !!filters.from && !!filters.to }
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-1">
          {Array.from({ length: 5 }, (_, i) => (
            <MerchantSkeleton key={String(i)} />
          ))}
        </div>
      );
    }

    if (!data?.data.length) {
      return (
        <div className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground text-sm">No merchants found</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {data.data.map((merchant, _index) => (
          <div
            className="flex items-center justify-between"
            key={merchant.merchantName}
          >
            <div>
              <p className="font-medium text-sm leading-none">
                {merchant.merchantName}
              </p>
              <p className="text-muted-foreground text-xs">
                {merchant.transactionCount} transaction
                {merchant.transactionCount !== 1 ? "s" : ""}
              </p>
            </div>
            <span className="font-medium text-sm">
              {formatCurrency(merchant.totalAmount, data.currency)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top merchants</CardTitle>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
