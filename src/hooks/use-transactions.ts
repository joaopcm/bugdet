import { useTransactionsFilters } from '@/components/logged-in/transactions/filters/search-params'
import { trpc } from '@/lib/trpc/client'
import { format } from 'date-fns'

export function useTransactions() {
  const { searchParams } = useTransactionsFilters()

  return trpc.transactions.list.useQuery({
    categoryId: searchParams.category === 'all' ? null : searchParams.category,
    from: searchParams.from ? format(searchParams.from, 'yyyy-MM-dd') : null,
    to: searchParams.to ? format(searchParams.to, 'yyyy-MM-dd') : null,
    query: searchParams.query || null,
    ids: searchParams.ids || [],
  })
}
