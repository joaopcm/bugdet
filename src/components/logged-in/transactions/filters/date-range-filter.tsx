"use client";

import { DateRangeFilter as SharedDateRangeFilter } from "@/components/logged-in/shared/date-range-filter";
import { usePagination } from "@/hooks/use-pagination";
import { useTransactionsFilters } from "./search-params";

export function DateRangeFilter() {
  const { transactionFilters, setTransactionFilters } =
    useTransactionsFilters();
  const { setPagination } = usePagination("transactions");

  const handleFilterChange = (updates: { from: Date; to: Date }) => {
    setTransactionFilters(updates);
    setPagination({ page: 1 });
  };

  return (
    <SharedDateRangeFilter
      from={transactionFilters.from}
      onFilterChange={handleFilterChange}
      to={transactionFilters.to}
    />
  );
}
