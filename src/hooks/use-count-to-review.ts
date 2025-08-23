import { trpc } from '@/lib/trpc/client'

export function useCountToReview() {
  return trpc.transactions.countToReview.useQuery()
}
