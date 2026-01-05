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

interface CategoriesPaginationProps {
  hasMore: boolean
}

export function CategoriesPagination({ hasMore }: CategoriesPaginationProps) {
  const { pagination, setPagination } = usePagination('categories')

  const currentPage = pagination.page
  const hasNextPage = hasMore
  const hasPreviousPage = currentPage > 1

  function handlePageChange(page: number) {
    setPagination({ page })
  }

  return (
    <div className="flex items-center justify-between mt-8 gap-4">
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

          {/* Show page 1 if not current and not adjacent */}
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

          {/* Previous page */}
          {hasPreviousPage && (
            <PaginationItem>
              <PaginationLink onClick={() => handlePageChange(currentPage - 1)}>
                {currentPage - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {/* Current page */}
          <PaginationItem>
            <PaginationLink isActive={true}>{currentPage}</PaginationLink>
          </PaginationItem>

          {/* Next page */}
          {hasNextPage && (
            <PaginationItem>
              <PaginationLink onClick={() => handlePageChange(currentPage + 1)}>
                {currentPage + 1}
              </PaginationLink>
            </PaginationItem>
          )}

          {/* Show ellipsis and more pages if available */}
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
