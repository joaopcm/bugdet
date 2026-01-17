import { useCategorizationRulesFilters } from "@/components/logged-in/categorization-rules/filters/search-params";
import { MAX_LIMIT_PER_PAGE } from "@/constants/pagination";
import { trpc } from "@/lib/trpc/client";
import { usePagination } from "./use-pagination";

export function useCategorizationRules(
  params: { ignoreFilters?: boolean; ignorePagination?: boolean } = {}
) {
  const { filters } = useCategorizationRulesFilters();
  const { pagination } = usePagination("categorization-rules");

  return trpc.categorizationRules.list.useQuery({
    filters: {
      query: params.ignoreFilters ? null : filters.query || null,
      enabled: params.ignoreFilters ? null : filters.enabled,
    },
    pagination: {
      page: params.ignorePagination ? 1 : pagination.page,
      limit: params.ignorePagination ? MAX_LIMIT_PER_PAGE : pagination.limit,
    },
  });
}

export function useRefetchCategorizationRules() {
  const utils = trpc.useUtils();
  return () => utils.categorizationRules.list.invalidate();
}
