"use client";

import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Kbd } from "@/components/ui/kbd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCategories } from "@/hooks/use-categories";
import { usePagination } from "@/hooks/use-pagination";
import { useTransactionsFilters } from "./search-params";

const CATEGORY_SHORTCUT = "C";

export function CategoryFilter() {
  const { data: categories } = useCategories({
    ignoreFilters: true,
    ignorePagination: true,
  });
  const { transactionFilters, setTransactionFilters } =
    useTransactionsFilters();
  const { setPagination } = usePagination("transactions");
  const [isOpen, setIsOpen] = useState(false);

  useHotkeys(CATEGORY_SHORTCUT, (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  });

  return (
    <Select
      onOpenChange={setIsOpen}
      onValueChange={(value) => {
        setTransactionFilters({ category: value });
        setPagination({ page: 1 });
      }}
      open={isOpen}
      value={transactionFilters.category || undefined}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <SelectTrigger className="w-full" id="categoryId">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
        </TooltipTrigger>
        <TooltipContent>
          Or press <Kbd variant="outline">{CATEGORY_SHORTCUT}</Kbd> to filter by
          a specific category
        </TooltipContent>
      </Tooltip>
      <SelectContent>
        <SelectItem value="all">All categories</SelectItem>
        {categories?.data.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
