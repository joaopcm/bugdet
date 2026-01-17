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
import { useMostFrequentCategory } from "@/hooks/use-most-frequent-category";
import { usePagination } from "@/hooks/use-pagination";
import { useTransactionsFilters } from "../search-params";

const MOST_FREQUENT_CATEGORY_SHORTCUT = "4";

export function MostFrequentCategory() {
  const { data: category, isLoading } = useMostFrequentCategory();
  const { transactionFilters, setTransactionFilters } =
    useTransactionsFilters();
  const { setPagination } = usePagination("transactions");

  useHotkeys(MOST_FREQUENT_CATEGORY_SHORTCUT, () => handleClick());

  if (isLoading) {
    return <Skeleton className="h-[24px] w-[151px]" />;
  }

  if (!category) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="select-none" variant="secondary">
            Most frequent category
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-pretty" side="bottom">
          I couldn't find the most frequent category in the last 45 days. Sorry
          about that.
        </TooltipContent>
      </Tooltip>
    );
  }

  function handleClick() {
    if (!category) {
      return;
    }

    setPagination({ page: 1 });

    if (transactionFilters.category === category.categoryId) {
      setTransactionFilters({
        category: "all",
      });
      return;
    }

    setTransactionFilters({
      category: category.categoryId,
      // Reset all other filters
      ids: [],
      from: null,
      to: null,
      query: null,
    });
  }

  const isSelected = transactionFilters.category === category.categoryId;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge asChild clickable variant={isSelected ? "default" : "outline"}>
          <button
            className="transition-none"
            onClick={handleClick}
            type="button"
          >
            Most frequent category
          </button>
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-pretty" side="bottom">
        Filter transactions by "{category.categoryName}", the most frequent
        category in the last 45 days.
        <br />
        <br />
        Press <Kbd variant="outline">{MOST_FREQUENT_CATEGORY_SHORTCUT}</Kbd> to
        activate this filter.
      </TooltipContent>
    </Tooltip>
  );
}
