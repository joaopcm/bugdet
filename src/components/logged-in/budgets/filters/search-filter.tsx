"use client";

import { SearchIcon } from "lucide-react";
import { useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useDebounceCallback } from "usehooks-ts";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePagination } from "@/hooks/use-pagination";
import { useBudgetsFilters } from "./search-params";

const SEARCH_SHORTCUT = "S";

export function SearchFilter() {
  const { budgetFilters, setBudgetFilters } = useBudgetsFilters();
  const { setPagination } = usePagination("budgets");
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSetSearchParams = useDebounceCallback((value: string) => {
    setBudgetFilters({ query: value });
    setPagination({ page: 1 });
  }, 500);

  useHotkeys(SEARCH_SHORTCUT, (e) => {
    e.preventDefault();
    inputRef.current?.focus();
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative w-full">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-50" />
          <Input
            className="pl-9"
            defaultValue={budgetFilters.query || ""}
            onChange={(e) => debouncedSetSearchParams(e.target.value)}
            placeholder="Search by budget name..."
            ref={inputRef}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        Or press <Kbd variant="outline">{SEARCH_SHORTCUT}</Kbd> to search by
        budget name
      </TooltipContent>
    </Tooltip>
  );
}
