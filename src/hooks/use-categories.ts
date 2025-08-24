import { useCategoriesFilters } from '@/components/logged-in/categories/filters/search-params'
import { trpc } from '@/lib/trpc/client'
import { usePagination } from './use-pagination'

export function useCategories(params: { ignoreFilters?: boolean } = {}) {
  const { categoryFilters } = useCategoriesFilters()
  const { pagination } = usePagination()

  return trpc.categories.list.useQuery({
    filters: {
      query: params.ignoreFilters ? null : categoryFilters.query || null,
    },
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
    },
  })
}
