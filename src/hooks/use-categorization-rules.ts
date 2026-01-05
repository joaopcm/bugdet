import { useCategorizationRulesFilters } from '@/components/logged-in/categorization-rules/filters/search-params'
import { MAX_LIMIT_PER_PAGE } from '@/constants/pagination'
import { trpc } from '@/lib/trpc/client'
import { usePagination } from './use-pagination'

/**
 * Fetches categorization rules using the current filters and pagination settings.
 *
 * @param params - Options to override filters or pagination behavior
 * @param params.ignoreFilters - If `true`, ignore active filters (query and enabled) and request unfiltered results
 * @param params.ignorePagination - If `true`, request the first page with the maximum page size instead of the current pagination
 * @returns The TRPC query object for the categorization rules list, including status, data, and helper methods
 */
export function useCategorizationRules(
  params: {
    ignoreFilters?: boolean
    ignorePagination?: boolean
  } = {},
) {
  const { filters } = useCategorizationRulesFilters()
  const { pagination } = usePagination('categorization-rules')

  return trpc.categorizationRules.list.useQuery({
    filters: {
      query: params.ignoreFilters ? null : filters.query || null,
      enabled: params.ignoreFilters ? null : filters.enabled,
    },
    pagination: {
      page: params.ignorePagination ? 1 : pagination.page,
      limit: params.ignorePagination ? MAX_LIMIT_PER_PAGE : pagination.limit,
    },
  })
}

export function useRefetchCategorizationRules() {
  const utils = trpc.useUtils()
  return () => utils.categorizationRules.list.invalidate()
}