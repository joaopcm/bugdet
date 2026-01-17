import { useCallback } from "react";
import { useBudgetsFilters } from "@/components/logged-in/budgets/filters/search-params";
import { MAX_LIMIT_PER_PAGE } from "@/constants/pagination";
import { trpc } from "@/lib/trpc/client";
import { usePagination } from "./use-pagination";

export function useInvalidateBudgets() {
  const utils = trpc.useUtils();
  return useCallback(() => {
    utils.budgets.invalidate();
  }, [utils]);
}

export function useBudgets(
  params: { ignoreFilters?: boolean; ignorePagination?: boolean } = {}
) {
  const { budgetFilters } = useBudgetsFilters();
  const { pagination } = usePagination("budgets");

  return trpc.budgets.list.useQuery({
    filters: {
      query: params.ignoreFilters ? null : budgetFilters.query || null,
      month: budgetFilters.month,
    },
    pagination: {
      page: params.ignorePagination ? 1 : pagination.page,
      limit: params.ignorePagination ? MAX_LIMIT_PER_PAGE : pagination.limit,
    },
  });
}
