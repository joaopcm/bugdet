import { parseAsLocalDate } from '@/lib/utils'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'

export function useTransactionsFilters() {
  const [searchParams, setSearchParams] = useQueryStates({
    category: parseAsString.withDefault('all'),
    from: parseAsLocalDate,
    to: parseAsLocalDate,
    query: parseAsString.withDefault(''),
    ids: parseAsArrayOf(parseAsString).withDefault([]),
  })

  return {
    searchParams,
    setSearchParams,
  }
}
