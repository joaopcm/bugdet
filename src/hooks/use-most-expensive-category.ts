import { trpc } from '@/lib/trpc/client'

export function useMostExpensiveCategory() {
  return trpc.transactions.getMostExpensiveCategory.useQuery()
}
