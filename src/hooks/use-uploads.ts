import { useUploadsFilters } from '@/components/logged-in/uploads/filters/search-params'
import { trpc } from '@/lib/trpc/client'
import { usePagination } from './use-pagination'

/**
 * Fetches the uploads list using current uploads filters and the 'uploads' pagination context.
 *
 * The query uses `uploadsFilters.query` (or `null` if undefined) and the pagination `page` and `limit`
 * obtained from the 'uploads' pagination context.
 *
 * @returns The TRPC query result for the uploads list, containing fetched data, status flags, and query controls.
 */
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