"use client";

import { DateRangeFilter } from "@/components/logged-in/shared/date-range-filter";
import { useDashboardFilters } from "./search-params";

export function DashboardFilters() {
  const { filters, setFilters } = useDashboardFilters();

  return (
    <DateRangeFilter
      from={filters.from}
      onFilterChange={setFilters}
      to={filters.to}
    />
  );
}
