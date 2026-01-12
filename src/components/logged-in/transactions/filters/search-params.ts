import { parseAsLocalDate } from '@/lib/utils'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'

export function useTransactionsFilters() {
  const [transactionFilters, setTransactionFilters] = useQueryStates({
    category: parseAsString.withDefault('all'),
    from: parseAsLocalDate,
    to: parseAsLocalDate,
    query: parseAsString.withDefault(''),
    ids: parseAsArrayOf(parseAsString).withDefault([]),
    uploadId: parseAsString.withDefault('all'),
  })

  return {
    transactionFilters,
    setTransactionFilters,
  }
}
