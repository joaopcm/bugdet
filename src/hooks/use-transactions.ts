import { useTransactionsFilters } from '@/components/logged-in/transactions/filters/search-params'
import { trpc } from '@/lib/trpc/client'

export function useTransactions() {
  const { searchParams } = useTransactionsFilters()

  return trpc.transactions.list.useQuery({
    categoryId: searchParams.category === 'all' ? null : searchParams.category,
  })
}
