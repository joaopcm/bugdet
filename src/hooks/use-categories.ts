import { useCategoriesFilters } from '@/components/logged-in/categories/filters/search-params'
import { MAX_LIMIT_PER_PAGE } from '@/constants/pagination'
import { trpc } from '@/lib/trpc/client'
import { usePagination } from './use-pagination'

/**
 * Provides the categories list query, applying category filters and pagination unless overridden by params.
 *
 * @param params - Optional behavior overrides
 * @param params.ignoreFilters - If true, do not apply category filters to the query (query filter will be null)
 * @param params.ignorePagination - If true, use the first page and the maximum limit instead of current pagination state
 * @returns The query result object for the categories list containing fetched data and query state
 */
export function useCategories(
  params: {
    ignoreFilters?: boolean
    ignorePagination?: boolean
  } = {},
) {
  const { categoryFilters } = useCategoriesFilters()
  const { pagination } = usePagination('categories')

  return trpc.categories.list.useQuery({
    filters: {
      query: params.ignoreFilters ? null : categoryFilters.query || null,
    },
    pagination: {
      page: params.ignorePagination ? 1 : pagination.page,
      limit: params.ignorePagination ? MAX_LIMIT_PER_PAGE : pagination.limit,
    },
  })
}