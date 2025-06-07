import { trpc } from '@/lib/trpc/client'

export function useUploads() {
  return trpc.uploads.list.useQuery()
}
