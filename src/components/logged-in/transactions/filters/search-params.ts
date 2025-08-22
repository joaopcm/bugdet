import { parseAsString, useQueryStates } from 'nuqs'

export function useTransactionsFilters() {
  const [searchParams, setSearchParams] = useQueryStates({
    category: parseAsString.withDefault('all'),
  })

  return {
    searchParams,
    setSearchParams,
  }
}
