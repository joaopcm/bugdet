import { useCategoriesFilters } from '@/components/logged-in/categories/filters/search-params'
import { MAX_LIMIT_PER_PAGE } from '@/constants/pagination'
import { trpc } from '@/lib/trpc/client'
import { usePagination } from './use-pagination'

export function useCategories(
  params: {
    ignoreFilters?: boolean
    ignorePagination?: boolean
  } = {},
) {
  const { categoryFilters } = useCategoriesFilters()
  const { pagination } = usePagination()

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
