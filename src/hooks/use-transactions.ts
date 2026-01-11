import { useTransactionsFilters } from '@/components/logged-in/transactions/filters/search-params'
import { trpc } from '@/lib/trpc/client'
import { format } from 'date-fns'
import { useCountToReview } from './use-count-to-review'
import { useMostExpensiveCategory } from './use-most-expensive-category'
import { useMostExpensiveMerchant } from './use-most-expensive-merchant'
import { useMostFrequentCategory } from './use-most-frequent-category'
import { useMostFrequentMerchant } from './use-most-frequent-merchant'
import { usePagination } from './use-pagination'

export function useTransactions() {
  const { transactionFilters } = useTransactionsFilters()
  const { pagination } = usePagination('transactions')

  const { refetch: refetchCountToReview } = useCountToReview()
  const { refetch: refetchMostFrequentMerchant } = useMostFrequentMerchant()
  const { refetch: refetchMostFrequentCategory } = useMostFrequentCategory()
  const { refetch: refetchMostExpensiveMerchant } = useMostExpensiveMerchant()
  const { refetch: refetchMostExpensiveCategory } = useMostExpensiveCategory()

  const { refetch: refetchTransactions, ...context } =
    trpc.transactions.list.useQuery({
      filters: {
        categoryId:
          transactionFilters.category === 'all'
            ? null
            : transactionFilters.category,
        uploadId:
          transactionFilters.uploadId === 'all'
            ? null
            : transactionFilters.uploadId,
        from: transactionFilters.from
          ? format(transactionFilters.from, 'yyyy-MM-dd')
          : null,
        to: transactionFilters.to
          ? format(transactionFilters.to, 'yyyy-MM-dd')
          : null,
        query: transactionFilters.query || null,
        ids: transactionFilters.ids || [],
      },
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
      },
    })

  function refetch() {
    refetchTransactions()
    refetchCountToReview()
    refetchMostFrequentMerchant()
    refetchMostFrequentCategory()
    refetchMostExpensiveMerchant()
    refetchMostExpensiveCategory()
  }

  return {
    ...context,
    refetch,
  }
}
