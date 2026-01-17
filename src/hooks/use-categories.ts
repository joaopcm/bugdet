import { useCallback } from "react";
import { useCategoriesFilters } from "@/components/logged-in/categories/filters/search-params";
import { MAX_LIMIT_PER_PAGE } from "@/constants/pagination";
import { trpc } from "@/lib/trpc/client";
import { usePagination } from "./use-pagination";

export function useInvalidateCategories() {
  const utils = trpc.useUtils();
  return useCallback(() => {
    utils.categories.invalidate();
  }, [utils]);
}

export function useCategories(
  params: { ignoreFilters?: boolean; ignorePagination?: boolean } = {}
) {
  const { categoryFilters } = useCategoriesFilters();
  const { pagination } = usePagination("categories");

  return trpc.categories.list.useQuery({
    filters: {
      query: params.ignoreFilters ? null : categoryFilters.query || null,
    },
    pagination: {
      page: params.ignorePagination ? 1 : pagination.page,
      limit: params.ignorePagination ? MAX_LIMIT_PER_PAGE : pagination.limit,
    },
  });
}
