import { useUploadsFilters } from '@/components/logged-in/uploads/filters/search-params'
import { trpc } from '@/lib/trpc/client'
import { useCallback } from 'react'
import { usePagination } from './use-pagination'

export function useInvalidateUploads() {
  const utils = trpc.useUtils()
  return useCallback(() => {
    utils.uploads.invalidate()
  }, [utils])
}

export function useUploads() {
  const { uploadsFilters } = useUploadsFilters()
  const { pagination } = usePagination('uploads')

  return trpc.uploads.list.useQuery({
    filters: {
      query: uploadsFilters.query || null,
    },
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
    },
  })
}
