import { DEFAULT_LIMIT_PER_PAGE } from '@/constants/pagination'
import { parseAsInteger, useQueryStates } from 'nuqs'

export function usePagination() {
  const [pagination, setPagination] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(DEFAULT_LIMIT_PER_PAGE),
  })

  return {
    pagination,
    setPagination,
  }
}
