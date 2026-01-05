'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPageSize,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { usePagination } from '@/hooks/use-pagination'

interface RulesPaginationProps {
  hasMore: boolean
}

/**
 * Render pagination controls for the categorization rules list.
 *
 * Renders a page-size selector, previous/next buttons, numeric page links, and ellipses where appropriate.
 *
 * @param hasMore - Whether additional pages exist after the current page
 * @returns The JSX element containing the pagination UI
 */
export function RulesPagination({ hasMore }: RulesPaginationProps) {
  const { pagination, setPagination } = usePagination('categorization-rules')

  const currentPage = pagination.page
  const hasNextPage = hasMore
  const hasPreviousPage = currentPage > 1

  function handlePageChange(page: number) {
    setPagination({ page })
  }

  return (
    <div className="mt-8 flex items-center justify-between gap-4">
      <PaginationPageSize
        value={pagination.limit}
        onChange={(limit) => setPagination({ limit, page: 1 })}
      />

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() =>
                hasPreviousPage && handlePageChange(currentPage - 1)
              }
              className={
                !hasPreviousPage
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>

          {currentPage > 2 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => handlePageChange(1)}>
                  1
                </PaginationLink>
              </PaginationItem>
              {currentPage > 3 && <PaginationEllipsis />}
            </>
          )}

          {hasPreviousPage && (
            <PaginationItem>
              <PaginationLink onClick={() => handlePageChange(currentPage - 1)}>
                {currentPage - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationLink isActive={true}>{currentPage}</PaginationLink>
          </PaginationItem>

          {hasNextPage && (
            <PaginationItem>
              <PaginationLink onClick={() => handlePageChange(currentPage + 1)}>
                {currentPage + 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {hasNextPage && <PaginationEllipsis />}

          <PaginationItem>
            <PaginationNext
              onClick={() => hasNextPage && handlePageChange(currentPage + 1)}
              className={
                !hasNextPage
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}