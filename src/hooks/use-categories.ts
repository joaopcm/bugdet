import { trpc } from '@/lib/trpc/client'

export function useCategories() {
  return trpc.categories.list.useQuery()
}
