import { trpc } from '@/lib/trpc/client'

export function useMostFrequentMerchant() {
  return trpc.transactions.getMostFrequentMerchant.useQuery()
}
