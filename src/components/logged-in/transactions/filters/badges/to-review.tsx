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
import { useCountToReview } from "@/hooks/use-count-to-review";
import { usePagination } from "@/hooks/use-pagination";
import { useTransactionsFilters } from "../search-params";

const TO_REVIEW_SHORTCUT = "1";

export function ToReview() {
  const { data: transactions, isLoading } = useCountToReview();
  const { transactionFilters, setTransactionFilters } =
    useTransactionsFilters();
  const { setPagination } = usePagination("transactions");

  useHotkeys(TO_REVIEW_SHORTCUT, () => handleClick());

  if (isLoading) {
    return <Skeleton className="h-[24px] w-[98px]" />;
  }

  if (!transactions?.length) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="select-none" variant="secondary">
            To review
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-pretty" side="bottom">
          There are no transactions to review. I'm pretty confident in my
          classifications.
        </TooltipContent>
      </Tooltip>
    );
  }

  function handleClick() {
    setPagination({ page: 1 });

    if (transactionFilters.ids.length > 0) {
      setTransactionFilters({
        ids: [],
      });
      return;
    }

    setTransactionFilters({
      ids: transactions?.map((transaction) => transaction.id) ?? [],
      // Reset all other filters
      category: "all",
      from: null,
      to: null,
      query: null,
    });
  }

  const isSelected = transactionFilters.ids.length > 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge asChild clickable variant={isSelected ? "default" : "outline"}>
          <button
            className="transition-none"
            onClick={handleClick}
            type="button"
          >
            To review ({transactions?.length})
          </button>
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-pretty" side="bottom">
        I wasn't entirely sure when classifying {transactions?.length}{" "}
        {transactions?.length === 1 ? "transaction" : "transactions"}. Click to
        list and review {transactions?.length === 1 ? "it" : "them"}.
        <br />
        <br />
        I'll improve my classification skills over time as you review them.
        <br />
        <br />
        Press <Kbd variant="outline">{TO_REVIEW_SHORTCUT}</Kbd> to activate this
        filter.
      </TooltipContent>
    </Tooltip>
  );
}
