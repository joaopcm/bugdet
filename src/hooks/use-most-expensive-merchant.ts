import { trpc } from '@/lib/trpc/client'

export function useMostExpensiveMerchant() {
  return trpc.transactions.getMostExpensiveMerchant.useQuery()
}
