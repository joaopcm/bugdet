"use client";

import { useHotkeys } from "react-hotkeys-hook";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMostExpensiveMerchant } from "@/hooks/use-most-expensive-merchant";
import { usePagination } from "@/hooks/use-pagination";
import { formatCurrency } from "@/lib/utils";
import { useTransactionsFilters } from "../search-params";

const MOST_EXPENSIVE_MERCHANT_SHORTCUT = "2";

export function MostExpensiveMerchant() {
  const { data: merchant, isLoading } = useMostExpensiveMerchant();
  const { transactionFilters, setTransactionFilters } =
    useTransactionsFilters();
  const { setPagination } = usePagination("transactions");

  useHotkeys(MOST_EXPENSIVE_MERCHANT_SHORTCUT, () => handleClick());

  if (isLoading) {
    return <Skeleton className="h-[24px] w-[151px]" />;
  }

  if (!merchant) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="select-none" variant="secondary">
            Most expensive merchant
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-pretty" side="bottom">
          I couldn't find the most expensive merchant in the last 45 days. Sorry
          about that.
        </TooltipContent>
      </Tooltip>
    );
  }

  function handleClick() {
    if (!merchant) {
      return;
    }

    setPagination({ page: 1 });

    if (transactionFilters.query === merchant.merchantName) {
      setTransactionFilters({
        query: null,
      });
      return;
    }

    setTransactionFilters({
      query: merchant.merchantName,
      // Reset all other filters
      ids: [],
      from: null,
      to: null,
      category: "all",
    });
  }

  const isSelected = transactionFilters.query === merchant.merchantName;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge asChild clickable variant={isSelected ? "default" : "outline"}>
          <button
            className="transition-none"
            onClick={handleClick}
            type="button"
          >
            Most expensive merchant
          </button>
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-pretty" side="bottom">
        Filter transactions by "{merchant.merchantName}", the most expensive
        merchant in the last 45 days. You've spent{" "}
        {formatCurrency(merchant.totalAmount, merchant.currency)} on them.
        <br />
        <br />
        Press <Kbd variant="outline">{MOST_EXPENSIVE_MERCHANT_SHORTCUT}</Kbd> to
        activate this filter.
      </TooltipContent>
    </Tooltip>
  );
}
