import { trpc } from '@/lib/trpc/client'

export function useTransactions() {
  return trpc.transactions.list.useQuery()
}
