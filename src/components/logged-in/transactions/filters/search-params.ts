import { parseAsLocalDate } from '@/lib/utils'
import { parseAsString, useQueryStates } from 'nuqs'

export function useTransactionsFilters() {
  const [searchParams, setSearchParams] = useQueryStates({
    category: parseAsString.withDefault('all'),
    from: parseAsLocalDate,
    to: parseAsLocalDate,
  })

  return {
    searchParams,
    setSearchParams,
  }
}
