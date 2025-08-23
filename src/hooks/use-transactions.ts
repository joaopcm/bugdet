import { useTransactionsFilters } from '@/components/logged-in/transactions/filters/search-params'
import { trpc } from '@/lib/trpc/client'
import { format } from 'date-fns'
import { useCountToReview } from './use-count-to-review'
import { useMostExpensiveCategory } from './use-most-expensive-category'
import { useMostExpensiveMerchant } from './use-most-expensive-merchant'
import { useMostFrequentCategory } from './use-most-frequent-category'
import { useMostFrequentMerchant } from './use-most-frequent-merchant'

export function useTransactions() {
  const { searchParams } = useTransactionsFilters()
  const { refetch: refetchCountToReview } = useCountToReview()
  const { refetch: refetchMostFrequentMerchant } = useMostFrequentMerchant()
  const { refetch: refetchMostFrequentCategory } = useMostFrequentCategory()
  const { refetch: refetchMostExpensiveMerchant } = useMostExpensiveMerchant()
  const { refetch: refetchMostExpensiveCategory } = useMostExpensiveCategory()

  const { refetch: refetchTransactions, ...context } =
    trpc.transactions.list.useQuery({
      categoryId:
        searchParams.category === 'all' ? null : searchParams.category,
      from: searchParams.from ? format(searchParams.from, 'yyyy-MM-dd') : null,
      to: searchParams.to ? format(searchParams.to, 'yyyy-MM-dd') : null,
      query: searchParams.query || null,
      ids: searchParams.ids || [],
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
